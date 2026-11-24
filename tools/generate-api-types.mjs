#!/usr/bin/env node

/**
 * tools/generate-api-types.mjs
 *
 * Generates TypeScript type definitions for the AthlonIQ web client (web/src/types/api.generated.ts)
 * directly from docs/openapi.json.
 *
 * Usage:
 *   node tools/generate-api-types.mjs          # Generates web/src/types/api.generated.ts
 *   node tools/generate-api-types.mjs --check  # Verifies the file is up to date (exits 1 if stale)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const OPENAPI_PATH = path.join(REPO_ROOT, "docs", "openapi.json");
const OUTPUT_PATH = path.join(REPO_ROOT, "web", "src", "types", "api.generated.ts");

function resolveRef(ref) {
  if (!ref || !ref.startsWith("#/components/schemas/")) {
    return "unknown";
  }
  return ref.replace("#/components/schemas/", "");
}

function schemaToTsType(prop, schemas, depth = 0) {
  if (!prop) return "unknown";

  if (prop.$ref) {
    return resolveRef(prop.$ref);
  }

  if (prop.anyOf && Array.isArray(prop.anyOf)) {
    const types = prop.anyOf.map((sub) => {
      if (sub.type === "null") return "null";
      return schemaToTsType(sub, schemas, depth + 1);
    });
    // Deduplicate types
    const unique = Array.from(new Set(types));
    return unique.join(" | ");
  }

  if (prop.oneOf && Array.isArray(prop.oneOf)) {
    const types = prop.oneOf.map((sub) => schemaToTsType(sub, schemas, depth + 1));
    return Array.from(new Set(types)).join(" | ");
  }

  if (prop.enum && Array.isArray(prop.enum)) {
    return prop.enum.map((val) => JSON.stringify(val)).join(" | ");
  }

  switch (prop.type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array": {
      if (prop.items) {
        const itemType = schemaToTsType(prop.items, schemas, depth + 1);
        return itemType.includes(" | ") ? `(${itemType})[]` : `${itemType}[]`;
      }
      return "unknown[]";
    }
    case "object": {
      if (prop.additionalProperties) {
        if (typeof prop.additionalProperties === "object") {
          const valType = schemaToTsType(prop.additionalProperties, schemas, depth + 1);
          return `Record<string, ${valType}>`;
        }
        return "Record<string, unknown>";
      }
      if (prop.properties) {
        const fields = Object.entries(prop.properties).map(([k, v]) => {
          const optional = prop.required && prop.required.includes(k) ? "" : "?";
          const fieldType = schemaToTsType(v, schemas, depth + 1);
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
          return `${safeKey}${optional}: ${fieldType};`;
        });
        return `{ ${fields.join(" ")} }`;
      }
      return "Record<string, unknown>";
    }
    default:
      return "unknown";
  }
}

function sanitizeIdentifier(name) {
  // Replace characters not allowed in TypeScript identifiers
  return name.replace(/[^a-zA-Z0-9_$]/g, "_");
}

function generateTypes(openapi) {
  const schemas = openapi.components?.schemas || {};
  const paths = openapi.paths || {};

  const lines = [];

  lines.push(`/**`);
  lines.push(` * AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.`);
  lines.push(` *`);
  lines.push(` * AthlonIQ API TypeScript Definitions`);
  lines.push(` * Source: docs/openapi.json (OpenAPI ${openapi.openapi || "3.1.0"})`);
  lines.push(` * Title: ${openapi.info?.title || "AthlonIQ API"}`);
  lines.push(` * Version: ${openapi.info?.version || "0.1.0"}`);
  lines.push(` *`);
  lines.push(` * To regenerate, run:`);
  lines.push(` *   node tools/generate-api-types.mjs`);
  lines.push(` */`);
  lines.push(``);

  // 1. Schemas
  for (const [schemaName, schema] of Object.entries(schemas)) {
    const safeName = sanitizeIdentifier(schemaName);

    if (schema.description) {
      lines.push(`/**`);
      for (const descLine of schema.description.split("\n")) {
        lines.push(` * ${descLine}`);
      }
      lines.push(` */`);
    }

    if (schema.enum && Array.isArray(schema.enum)) {
      const enumValues = schema.enum.map((v) => JSON.stringify(v)).join(" | ");
      lines.push(`export type ${safeName} = ${enumValues};`);
      lines.push(``);
      continue;
    }

    if (schema.type === "object" || schema.properties) {
      lines.push(`export interface ${safeName} {`);
      const requiredSet = new Set(schema.required || []);

      for (const [propName, propDef] of Object.entries(schema.properties || {})) {
        if (propDef.description) {
          lines.push(`  /** ${propDef.description.replace(/\n/g, " ")} */`);
        }
        const isRequired = requiredSet.has(propName);
        const opt = isRequired ? "" : "?";
        const tsType = schemaToTsType(propDef, schemas);
        const safeProp = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propName)
          ? propName
          : JSON.stringify(propName);
        lines.push(`  ${safeProp}${opt}: ${tsType};`);
      }

      if (schema.additionalProperties && !schema.properties) {
        lines.push(`  [key: string]: unknown;`);
      }

      lines.push(`}`);
      lines.push(``);
      continue;
    }

    // Primitive or other type alias
    const tsType = schemaToTsType(schema, schemas);
    lines.push(`export type ${safeName} = ${tsType};`);
    lines.push(``);
  }

  // 2. Endpoint Operation Mappings
  lines.push(`/**`);
  lines.push(` * AthlonIQ REST API Endpoint Route Contracts`);
  lines.push(` */`);
  lines.push(`export interface ApiEndpoints {`);

  for (const [routePath, methods] of Object.entries(paths)) {
    lines.push(`  ${JSON.stringify(routePath)}: {`);

    for (const [method, operation] of Object.entries(methods)) {
      if (typeof operation !== "object" || !operation) continue;
      const lowerMethod = method.toLowerCase();

      lines.push(`    ${lowerMethod}: {`);
      if (operation.summary) {
        lines.push(`      // ${operation.summary}`);
      }

      // Request body
      const reqSchema =
        operation.requestBody?.content?.["application/json"]?.schema ||
        operation.requestBody?.content?.["multipart/form-data"]?.schema;

      if (reqSchema) {
        lines.push(`      requestBody: ${schemaToTsType(reqSchema, schemas)};`);
      } else {
        lines.push(`      requestBody?: never;`);
      }

      // Response 200
      const resSchema =
        operation.responses?.["200"]?.content?.["application/json"]?.schema;

      if (resSchema) {
        lines.push(`      response: ${schemaToTsType(resSchema, schemas)};`);
      } else {
        lines.push(`      response: unknown;`);
      }

      lines.push(`    };`);
    }

    lines.push(`  };`);
  }

  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

function main() {
  const isCheckMode = process.argv.includes("--check");

  if (!fs.existsSync(OPENAPI_PATH)) {
    console.error(`ERROR: OpenAPI specification not found at ${OPENAPI_PATH}`);
    process.exit(1);
  }

  const openapiContent = fs.readFileSync(OPENAPI_PATH, "utf8");
  const openapi = JSON.parse(openapiContent);

  const generatedTs = generateTypes(openapi);

  if (isCheckMode) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      console.error(
        `ERROR: Generated API types file does not exist at ${OUTPUT_PATH}.\n` +
          `Run 'node tools/generate-api-types.mjs' to generate it.`
      );
      process.exit(1);
    }

    const currentTs = fs.readFileSync(OUTPUT_PATH, "utf8");

    // Normalize newlines before comparing
    const normalizedCurrent = currentTs.replace(/\r\n/g, "\n").trim();
    const normalizedGenerated = generatedTs.replace(/\r\n/g, "\n").trim();

    if (normalizedCurrent !== normalizedGenerated) {
      console.error(
        `ERROR: ${OUTPUT_PATH} is stale and does not match ${OPENAPI_PATH}!\n` +
          `Run 'node tools/generate-api-types.mjs' to regenerate the TypeScript contracts.`
      );
      process.exit(1);
    }

    console.log(`[PASS] ${OUTPUT_PATH} is up-to-date with ${OPENAPI_PATH}.`);
    process.exit(0);
  } else {
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, generatedTs, "utf8");
    console.log(`[SUCCESS] Generated ${OUTPUT_PATH} from ${OPENAPI_PATH}`);
  }
}

main();
