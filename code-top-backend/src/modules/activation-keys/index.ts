import { Module } from "@medusajs/framework/utils"
import ActivationKeyModuleService from "./service"

export const ACTIVATION_KEY_MODULE = "activationKeys"

export default Module(ACTIVATION_KEY_MODULE, {
  service: ActivationKeyModuleService,
})

