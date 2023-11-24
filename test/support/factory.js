import DataFactory from '@rdfjs/data-model/Factory.js'
import DatasetFactory from '@rdfjs/dataset/Factory.js'
import Environment from '@rdfjs/environment'
import formats from '@rdfjs/formats'
import FormatsFactory from '@rdfjs/formats/Factory.js'

const factory = new Environment([
  DataFactory,
  DatasetFactory,
  FormatsFactory
])

factory.formats.import(formats)

export default factory
