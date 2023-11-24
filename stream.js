import toReadable from 'duplex-to/readable.js'
import { PassThrough, Readable } from 'readable-stream'
import { decode } from 'stream-chunks'
import checkResponse from './lib/checkResponse.js'
import createWriteOptions from './lib/createWriteOptions.js'

/**
 * Parse the given text with a parser matching the media type and return a stream of quads.
 * @param mediaType Media type that is used to look up the parser
 * @param text Text to parse
 * @param factory Factory that is used to find the parser and create the dataset
 * @param args Additional arguments for the parser
 * @returns {Promise<Dataset>} Parsed quads in a dataset
 */
function fromText (mediaType, text, { factory, ...args }) {
  const parser = factory.formats.parsers.get(mediaType)

  if (!parser) {
    return new Readable({
      read () {
        this.destroy(new Error(`unknown media type: ${mediaType}`))
      }
    })
  }

  return parser.import(Readable.from([text]), args)
}

/**
 * Parse the content of the given URL and return a stream of quads.
 * @param url URL to fetch the content from
 * @param factory Factory that is used to fetch the content and create the dataset
 * @param args Additional arguments for the fetch request
 * @returns {Promise<Dataset>} Parsed quads in a dataset
 */
function fromURL (url, { factory, ...args }) {
  const output = new PassThrough({ objectMode: true })

  setTimeout(async () => {
    try {
      const res = await factory.fetch(url, { ...args, method: 'GET' })

      await checkResponse(url, {}, res)

      const stream = await res.quadStream()

      stream
        .on('error', err => output.destroy(err))
        .pipe(output)
    } catch (err) {
      output.destroy(err)
    }
  }, 0)

  return toReadable(output)
}

/**
 * Serialize the given stream of quads to a text using a serializer matching the given media type.
 * @param mediaType Media type that is used to look up the serializer
 * @param dataset Dataset to serialize
 * @param factory Factory that is used to find the serializer
 * @param args Additional arguments for the serializer
 * @returns {Promise<String>} String of the serialized quads
 */
async function toText (mediaType, stream, { factory, ...args }) {
  const serializer = factory.formats.serializers.get(mediaType)

  if (!serializer) {
    throw new Error(`unknown media type: ${mediaType}`)
  }

  const textStream = serializer.import(stream, args)

  return decode(textStream, 'utf-8')
}

/**
 * Serialize the given stream of quads and push it to the given URL.
 * @param url URL to push the content to
 * @param dataset Dataset to serialize
 * @param factory Factory that is used to push the content
 * @param args Additional arguments for the fetch request
 * @returns {Promise<void>}
 */
async function toURL (url, stream, { factory, ...args }) {
  const options = createWriteOptions(url, stream)
  const res = await factory.fetch(url, { ...args, ...options })

  await checkResponse(url, options, res)
}

export {
  fromText,
  fromURL,
  toText,
  toURL
}
