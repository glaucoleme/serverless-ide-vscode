import { UNKNOWN } from "./../../../model/document"
import { ResolvedSchema } from ".."
import { FUNCTION } from "../../../model/globals"
import { YAMLDocument } from "../../../parser"
import { applyDocumentMutations } from "../mutation"
import { getDefaultGlobalsConfig } from "../../../parser/json/globals"

test("should do nothing if schema was not resolved", () => {
	const doc = new YAMLDocument(UNKNOWN, undefined)
	doc.globalsConfig = getDefaultGlobalsConfig()

	expect(applyDocumentMutations(undefined, doc)).toBeUndefined()
})

test("should return original schema if globals are not defined", () => {
	const emptySchema = {}
	const emptyGlobals = getDefaultGlobalsConfig()
	const resolvedSchema = new ResolvedSchema(emptySchema)
	const doc = new YAMLDocument(UNKNOWN, undefined)
	doc.globalsConfig = emptyGlobals

	expect(applyDocumentMutations(resolvedSchema, doc)).toBe(resolvedSchema)
})

test("should return original schema if definitions are defined", () => {
	const schema = {
		definitions: {}
	}
	const emptyGlobals = getDefaultGlobalsConfig()
	const resolvedSchema = new ResolvedSchema(schema)
	const doc = new YAMLDocument(UNKNOWN, undefined)
	doc.globalsConfig = emptyGlobals

	expect(applyDocumentMutations(resolvedSchema, doc)).toBe(resolvedSchema)
})

test("should return schema with mutations for existing resource", () => {
	const schema = {
		definitions: {
			"AWS::Serverless::Function": {
				properties: {
					Properties: {
						required: ["Handler", "Runtime"]
					}
				}
			}
		}
	}
	const globals = getDefaultGlobalsConfig()
	globals[FUNCTION].properties = ["Runtime"]
	const resolvedSchema = new ResolvedSchema(schema)
	const doc = new YAMLDocument(UNKNOWN, undefined)
	doc.globalsConfig = globals

	const newResolvedSchema = applyDocumentMutations(
		resolvedSchema,
		doc
	) as ResolvedSchema

	expect(newResolvedSchema).not.toBe(resolvedSchema)
	expect(newResolvedSchema.schema).toEqual({
		definitions: {
			"AWS::Serverless::Function": {
				properties: {
					Properties: {
						required: ["Handler"]
					}
				}
			}
		}
	})
})
