import fs from 'fs'
import path from 'path'
import warning from 'warning'
import some from 'lodash/some'
import startsWith from 'lodash/startsWith'
import isEmpty from 'lodash/isEmpty'
import MJMLElementsCollection, { registerMJElement } from '../MJMLElementsCollection'
import { registerMJRule } from 'mjml-validator'

const cwd = process.cwd()

const isRelativePath = (name) => {
  return some(['./', '.', '../'], (matcher) => startsWith(name, matcher))
}

const checkIfConfigFileExist = (options = {}) => {
  try {
    fs.statSync(`${options.cwd || cwd}/.mjmlconfig`)
    return true
  } catch (e) {
    warning(!isEmpty(MJMLElementsCollection), `No .mjmlconfig found in path ${cwd}, consider to add one`)
    return false
  }
}

const parseConfigFile = (options = {}) => {
  if (!checkIfConfigFileExist(options)) {
    return false
  }

  try {
    return JSON.parse(fs.readFileSync(`${options.cwd || cwd}/.mjmlconfig`).toString())
  } catch (e) {
    warning(false, `.mjmlconfig has a ParseError: ${e}`)
  }
}

const parsePackages = (packages, options = {}) => {
  if (!packages) {
    return;
  }

  packages.forEach(file => {
    if (!file) {
      return
    }

    try {
      const filename = path.join(options.cwd || cwd, file)
      const Component = isRelativePath(file) ? require(filename) : require.main.require(file)

      registerMJElement(Component.default || Component)
    } catch (e) {
      warning(false, `.mjmlconfig file ${file} opened from ${cwd} has an error : ${e}`)
    }
  })
}

const parseRules = (validators, options = {}) => {
  if (!validators) {
    return;
  }

  validators.forEach(file => {
    if (!file) {
      return
    }

    try {
      const filename = path.join(options.cwd || cwd, file)
      const rule = isRelativePath(file) ? require(filename) : require.main.require(file)

      registerMJRule(rule)
    } catch (e) {
      warning(false, `.mjmlconfig file ${file} opened from ${cwd} has an error : ${e}`)
    }
  })
}

export default (options = {}) => {
  const config = parseConfigFile(options)

  if (!config) {
    return;
  }

  parsePackages(config.packages, options)
  parseRules(config.validators, options)
}
