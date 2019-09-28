import { YAMLDocument } from "./../index"
import { ASTNode, ISchemaCollector } from "./ast-node"
import * as Json from "jsonc-parser"
import { JSONSchema } from "../../jsonSchema"
import { ValidationResult, ProblemSeverity } from "./validation-result"
import localize from "./localize"

export class NumberASTNode extends ASTNode<number> {
	isInteger: boolean

	constructor(
		document: YAMLDocument,
		parent: ASTNode,
		name: Json.Segment,
		start: number,
		end?: number
	) {
		super(document, parent, "number", name, start, end)
		this.isInteger = true
		this.value = Number.NaN
	}

	async validate(
		schema: JSONSchema,
		validationResult: ValidationResult,
		matchingSchemas: ISchemaCollector
	): Promise<void> {
		if (!matchingSchemas.include(this)) {
			return
		}

		// work around type validation in the base class
		let typeIsInteger = false
		if (
			schema.type === "integer" ||
			(Array.isArray(schema.type) &&
				(schema.type as string[]).indexOf("integer") !== -1)
		) {
			typeIsInteger = true
		}
		if (typeIsInteger && this.isInteger === true) {
			this.type = "integer"
		}
		await super.validate(schema, validationResult, matchingSchemas)
		this.type = "number"

		const val = this.value

		if (typeof schema.multipleOf === "number") {
			if (val % schema.multipleOf !== 0) {
				validationResult.problems.push({
					location: { start: this.start, end: this.end },
					severity: ProblemSeverity.Error,
					message: localize(
						"multipleOfWarning",
						"Value is not divisible by {0}.",
						schema.multipleOf
					)
				})
			}
		}

		if (typeof schema.minimum === "number") {
			if (schema.exclusiveMinimum && val <= schema.minimum) {
				validationResult.problems.push({
					location: { start: this.start, end: this.end },
					severity: ProblemSeverity.Error,
					message: localize(
						"exclusiveMinimumWarning",
						"Value is below the exclusive minimum of {0}.",
						schema.minimum
					)
				})
			}
			if (!schema.exclusiveMinimum && val < schema.minimum) {
				validationResult.problems.push({
					location: { start: this.start, end: this.end },
					severity: ProblemSeverity.Error,
					message: localize(
						"minimumWarning",
						"Value is below the minimum of {0}.",
						schema.minimum
					)
				})
			}
		}

		if (typeof schema.maximum === "number") {
			if (schema.exclusiveMaximum && val >= schema.maximum) {
				validationResult.problems.push({
					location: { start: this.start, end: this.end },
					severity: ProblemSeverity.Error,
					message: localize(
						"exclusiveMaximumWarning",
						"Value is above the exclusive maximum of {0}.",
						schema.maximum
					)
				})
			}
			if (!schema.exclusiveMaximum && val > schema.maximum) {
				validationResult.problems.push({
					location: { start: this.start, end: this.end },
					severity: ProblemSeverity.Error,
					message: localize(
						"maximumWarning",
						"Value is above the maximum of {0}.",
						schema.maximum
					)
				})
			}
		}
	}
}
