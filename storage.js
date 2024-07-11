// AI generated
function encode(text) {
  return new Promise((resolve, reject) => {
    // Convert the string to a Uint8Array of bytes
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text)

    // Create a CompressionStream with the "gzip" algorithm
    const compressedStream = new CompressionStream('gzip')

    // Write the bytes to the writable side of the CompressionStream
    const writer = compressedStream.writable.getWriter()
    writer.write(bytes).catch(reject)
    writer.close().catch(reject)

    // Read the compressed bytes from the readable side of the CompressionStream
    const compressedBytes = []
    const reader = compressedStream.readable.getReader()
    const readChunk = () => {
      reader
        .read()
        .then(({ value, done }) => {
          if (done) {
            // Convert the compressed bytes to a Base64 string
            const compressedBase64String = btoa(
              String.fromCharCode(...compressedBytes),
            )
            resolve(compressedBase64String)
          } else {
            compressedBytes.push(...value)
            readChunk()
          }
        })
        .catch(reject)
    }
    readChunk()
  })
}

// AI generated
function decode(compressedBase64String) {
  return new Promise((resolve, reject) => {
    // Convert the Base64 string to compressed bytes
    const compressedBytes = Uint8Array.from(atob(compressedBase64String), (c) =>
      c.charCodeAt(0),
    )

    // Create a DecompressionStream with the "gzip" algorithm
    const decompressedStream = new DecompressionStream('gzip')

    // Write the compressed bytes to the writable side of the DecompressionStream
    const writer = decompressedStream.writable.getWriter()
    writer.write(compressedBytes).catch(reject)
    writer.close().catch(reject)

    // Read the decompressed bytes from the readable side of the DecompressionStream
    const decompressedBytes = []
    const reader = decompressedStream.readable.getReader()
    const readChunk = () => {
      reader
        .read()
        .then(({ value, done }) => {
          if (done) {
            // Convert the decompressed bytes to a string
            const decoder = new TextDecoder()
            const decompressedString = decoder.decode(
              new Uint8Array(decompressedBytes),
            )
            resolve(decompressedString)
          } else {
            decompressedBytes.push(...value)
            readChunk()
          }
        })
        .catch(reject)
    }
    readChunk()
  })
}

//

export async function writeHash(value) {
  window.location.hash = value ? await encode(value) : ''
}

export async function readHash() {
  const hash = window.location.hash.slice(1)
  try {
    return decode(hash)
  } catch (err) {
    console.error('Error decoding grid text from URL hash:', err)
  }
  return ''
}

//

export function writeLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function readLocalStorage(key) {
  const value = localStorage.getItem(key)
  return value ? JSON.parse(value) : null
}
