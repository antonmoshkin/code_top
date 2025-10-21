import { Module } from "@medusajs/framework/utils"
import RobokassaModuleService from "./service"

export const ROBOKASSA_MODULE = "robokassa"

export default Module(ROBOKASSA_MODULE, {
  service: RobokassaModuleService,
})
