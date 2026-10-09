import type { docs_v1 } from "googleapis";
import type { DocumentType } from "@/app/base/models/DocumentTemplateModel";
import { batchUpdateGoogleDocument, getGoogleDocument } from "@/libraries/google/GoogleDocsClient";
import { TEMPLATE_CONTRACTS, allowedTemplatePlaceholder } from "@/libraries/google/GoogleDocsTemplateContracts";
import { PdfError } from "@/libraries/google/PdfError";

export type PdfParameters = Record<string, unknown>;
export type TemplateValidation = { valid: boolean; errors: string[]; warnings: string[]; placeholders: string[] };

const TOKEN_RE = /{{\s*([#/]?[a-z][a-z0-9_.]*)\s*}}/g;
const MALFORMED_RE = /{{|}}/;

function structuralText(elements: docs_v1.Schema$StructuralElement[] | undefined): string {
  let text = "";
  for (const element of elements ?? []) {
    for (const item of element.paragraph?.elements ?? []) text += item.textRun?.content ?? "";
    for (const row of element.table?.tableRows ?? []) {
      for (const cell of row.tableCells ?? []) text += structuralText(cell.content);
    }
  }
  return text;
}

function textRuns(elements: docs_v1.Schema$StructuralElement[] | undefined): string[] {
  const runs: string[] = [];
  for (const element of elements ?? []) {
    for (const item of element.paragraph?.elements ?? []) {
      if (item.textRun?.content) runs.push(item.textRun.content);
    }
    for (const row of element.table?.tableRows ?? []) {
      for (const cell of row.tableCells ?? []) runs.push(...textRuns(cell.content));
    }
  }
  return runs;
}

function documentParts(document: docs_v1.Schema$Document): docs_v1.Schema$StructuralElement[][] {
  return [
    document.body?.content ?? [],
    ...Object.values(document.headers ?? {}).map((header) => header.content ?? []),
    ...Object.values(document.footers ?? {}).map((footer) => footer.content ?? []),
    ...Object.values(document.footnotes ?? {}).map((footnote) => footnote.content ?? []),
  ];
}

function documentText(document: docs_v1.Schema$Document): string {
  return documentParts(document).map(structuralText).join("\n");
}

function rowText(row: docs_v1.Schema$TableRow): string {
  return (row.tableCells ?? []).map((cell) => structuralText(cell.content)).join(" | ");
}

function cellText(cell: docs_v1.Schema$TableCell): string {
  return structuralText(cell.content).replace(/\n+$/, "");
}

function extractTokens(text: string): string[] {
  return [...text.matchAll(TOKEN_RE)].map((match) => match[1]);
}

function flattenScalars(value: unknown, prefix = "", output: Record<string, string> = {}): Record<string, string> {
  if (Array.isArray(value)) return output;
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      flattenScalars(nested, prefix ? `${prefix}.${key}` : key, output);
    }
    return output;
  }
  if (prefix) output[prefix] = value === null || value === undefined || value === "" ? "—" : String(value);
  return output;
}

function renderText(template: string, collection: string, row: Record<string, unknown>, no: number): string {
  return template
    .replace(new RegExp(`{{\\s*#${collection}\\s*}}`, "g"), "")
    .replace(new RegExp(`{{\\s*\\/${collection}\\s*}}`, "g"), "")
    .replace(TOKEN_RE, (token, name: string) => {
      if (!name.startsWith(`${collection}.`)) return token;
      const key = name.slice(collection.length + 1);
      const value = key === "no" ? no : row[key];
      return value === null || value === undefined || value === "" ? "—" : String(value);
    });
}

type Prototype = { tableIndex: number; rowIndex: number; tableStart: number; cells: string[] };

function findPrototype(document: docs_v1.Schema$Document, collection: string): Prototype[] {
  const found: Prototype[] = [];
  (document.body?.content ?? []).forEach((element, tableIndex) => {
    const table = element.table;
    if (!table || element.startIndex === undefined) return;
    (table.tableRows ?? []).forEach((row, rowIndex) => {
      const text = rowText(row);
      const open = text.includes(`{{#${collection}}}`);
      const close = text.includes(`{{/${collection}}}`);
      if (open || close) {
        found.push({ tableIndex, rowIndex, tableStart: element.startIndex!, cells: (row.tableCells ?? []).map(cellText) });
      }
    });
  });
  return found;
}

export function inspectGoogleDocument(document: docs_v1.Schema$Document, documentType: DocumentType): TemplateValidation {
  const text = documentText(document);
  const placeholders = [...new Set(extractTokens(text))].sort();
  const errors: string[] = [];
  const warnings: string[] = [];
  const contract = TEMPLATE_CONTRACTS[documentType];

  const runs = documentParts(document).flatMap(textRuns);
  const split = placeholders.some((placeholder) => !runs.some((run) => extractTokens(run).includes(placeholder)));
  if (split || MALFORMED_RE.test(text.replace(TOKEN_RE, ""))) errors.push("Malformed or split placeholder token found.");
  for (const name of contract.requiredScalars) {
    if (!placeholders.includes(name)) errors.push(`Missing required placeholder: {{${name}}}`);
  }
  for (const collection of Object.keys(contract.collections)) {
    const prototypes = findPrototype(document, collection);
    if (prototypes.length === 0) errors.push(`Missing repeating row section: ${collection}`);
    else if (prototypes.length !== 1 || !rowTextFromPrototype(prototypes[0]).includes(`{{#${collection}}}`) || !rowTextFromPrototype(prototypes[0]).includes(`{{/${collection}}}`)) {
      errors.push(`Repeating row section must have one balanced prototype row: ${collection}`);
    }
  }
  for (const placeholder of placeholders) {
    if (!allowedTemplatePlaceholder(documentType, placeholder)) warnings.push(`Unknown placeholder: {{${placeholder}}}`);
  }
  return { valid: errors.length === 0, errors, warnings, placeholders };
}

function rowTextFromPrototype(prototype: Prototype): string {
  return prototype.cells.join(" | ");
}

async function expandCollection(documentId: string, collection: string, rows: Record<string, unknown>[]): Promise<void> {
  let document = await getGoogleDocument(documentId);
  const prototypes = findPrototype(document, collection);
  if (prototypes.length !== 1) throw new PdfError(`Invalid repeating row section: ${collection}.`, 500);
  const prototype = prototypes[0];
  const markerText = rowTextFromPrototype(prototype);
  if (!markerText.includes(`{{#${collection}}}`) || !markerText.includes(`{{/${collection}}}`)) {
    throw new PdfError(`Unbalanced repeating row section: ${collection}.`, 500);
  }

  if (rows.length > 0) {
    await batchUpdateGoogleDocument(documentId, rows.map(() => ({
      insertTableRow: {
        tableCellLocation: { tableStartLocation: { index: prototype.tableStart }, rowIndex: prototype.rowIndex, columnIndex: 0 },
        insertBelow: true,
      },
    })));
    document = await getGoogleDocument(documentId);
    const table = document.body?.content?.[prototype.tableIndex]?.table;
    const inserted = (table?.tableRows ?? []).slice(prototype.rowIndex + 1, prototype.rowIndex + 1 + rows.length);
    const insertRequests: any[] = [];
    inserted.forEach((row, index) => {
      (row.tableCells ?? []).forEach((cell, cellIndex) => {
        const startIndex = cell.content?.[0]?.startIndex;
        if (startIndex !== undefined) {
          insertRequests.push({ insertText: { location: { index: startIndex }, text: renderText(prototype.cells[cellIndex] ?? "", collection, rows[index], index + 1) } });
        }
      });
    });
    insertRequests.sort((a, b) => b.insertText.location.index - a.insertText.location.index);
    await batchUpdateGoogleDocument(documentId, insertRequests);
  }

  await batchUpdateGoogleDocument(documentId, [{
    deleteTableRow: {
      tableCellLocation: { tableStartLocation: { index: prototype.tableStart }, rowIndex: prototype.rowIndex, columnIndex: 0 },
    },
  }]);
}

export async function renderGoogleDocument(documentId: string, documentType: DocumentType, parameters: PdfParameters): Promise<void> {
  const initial = await getGoogleDocument(documentId);
  const validation = inspectGoogleDocument(initial, documentType);
  if (!validation.valid) throw new PdfError(`Invalid active PDF template: ${validation.errors.join(" ")}`, 500);

  for (const collection of Object.keys(TEMPLATE_CONTRACTS[documentType].collections)) {
    const rows = Array.isArray(parameters[collection]) ? parameters[collection] as Record<string, unknown>[] : [];
    await expandCollection(documentId, collection, rows);
  }

  const scalarValues = flattenScalars(parameters);
  for (const token of extractTokens(documentText(initial))) {
    if (!token.startsWith("#") && !token.startsWith("/") && allowedTemplatePlaceholder(documentType, token) && !(token in scalarValues)) {
      scalarValues[token] = "";
    }
  }
  const scalarRequests = Object.entries(scalarValues).map(([name, value]) => ({
    replaceAllText: { containsText: { text: `{{${name}}}`, matchCase: true }, replaceText: value },
  }));
  await batchUpdateGoogleDocument(documentId, scalarRequests);
  const finalDocument = await getGoogleDocument(documentId);
  const unresolved = extractTokens(documentText(finalDocument));
  if (unresolved.length > 0) throw new PdfError(`PDF template contains unresolved placeholders: ${unresolved.join(", ")}.`, 500);
}
