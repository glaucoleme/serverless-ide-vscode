import { CLOUD_FORMATION, SAM } from "./../../model/document"
import { YAMLDocument } from "./document"
import {
	API,
	FUNCTION,
	GlobalConfigItem,
	GlobalKeys,
	GlobalsConfig,
	SIMPLE_TABLE
} from "../../model/globals"
import { ObjectASTNode, PropertyASTNode } from "."
import { getPropertyNodeValue } from "../util"
import { Segment } from "vscode-json-languageservice"

export const GLOBALS_PATH: Segment[] = ["Globals"]

export const getDefaultGlobalsConfig = (): GlobalsConfig => ({
	[API]: {
		...GlobalKeys[API],
		properties: []
	},
	[FUNCTION]: {
		...GlobalKeys[FUNCTION],
		properties: []
	},
	[SIMPLE_TABLE]: {
		...GlobalKeys[SIMPLE_TABLE],
		properties: []
	}
})

export const collectGlobalPropertiesFromNode = (
	globalsNode: ObjectASTNode
): GlobalsConfig => {
	const globalsConfig: GlobalsConfig = getDefaultGlobalsConfig()

	globalsNode.getChildNodes().forEach(node => {
		if (node instanceof PropertyASTNode) {
			const propertyNode = node
			const location = propertyNode.getLocation()

			if (location in globalsConfig) {
				const configItem: GlobalConfigItem = globalsConfig[location]
				const propertyObjectNode = getPropertyNodeValue(
					propertyNode,
					String(location)
				)

				if (
					propertyObjectNode &&
					propertyObjectNode instanceof ObjectASTNode
				) {
					propertyObjectNode.getChildNodes().forEach(childNode => {
						if (childNode.type === "property") {
							const propertyChildNode = childNode as PropertyASTNode

							configItem.properties.push(
								propertyChildNode.key.location
							)
						}
					})
				}
			}
		}
	})

	return globalsConfig
}

export const collectGlobals = (document: YAMLDocument): GlobalsConfig => {
	if (
		document.documentType === CLOUD_FORMATION ||
		document.documentType === SAM
	) {
		const globalsNode = document.root.get(GLOBALS_PATH)

		if (
			globalsNode &&
			globalsNode instanceof PropertyASTNode &&
			globalsNode.value instanceof ObjectASTNode
		) {
			return collectGlobalPropertiesFromNode(globalsNode.value)
		}
	}

	return getDefaultGlobalsConfig()
}
