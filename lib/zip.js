// Минимальный ZIP-билдер без зависимостей (метод STORE — без сжатия).
// JPEG уже сжаты, поэтому store не теряет качество и не раздувает размер.
// buildZip([{ name, data: Buffer }]) -> Buffer

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0 ^ -1
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF]
  return (c ^ -1) >>> 0
}

export function buildZip(files) {
  const chunks = []
  const central = []
  let offset = 0

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8')
    const data = f.data
    const crc = crc32(data)
    const size = data.length

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)   // signature
    local.writeUInt16LE(20, 4)           // version needed
    local.writeUInt16LE(0x0800, 6)       // flags: UTF-8 names
    local.writeUInt16LE(0, 8)            // method: store
    local.writeUInt16LE(0, 10)           // mod time
    local.writeUInt16LE(22561, 12)       // mod date (2024-01-01)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(size, 18)        // compressed size
    local.writeUInt32LE(size, 22)        // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)           // extra len
    chunks.push(local, nameBuf, data)

    const cen = Buffer.alloc(46)
    cen.writeUInt32LE(0x02014b50, 0)     // central signature
    cen.writeUInt16LE(20, 4)             // version made by
    cen.writeUInt16LE(20, 6)             // version needed
    cen.writeUInt16LE(0x0800, 8)         // flags
    cen.writeUInt16LE(0, 10)             // method
    cen.writeUInt16LE(0, 12)             // mod time
    cen.writeUInt16LE(22561, 14)         // mod date
    cen.writeUInt32LE(crc, 16)
    cen.writeUInt32LE(size, 20)
    cen.writeUInt32LE(size, 24)
    cen.writeUInt16LE(nameBuf.length, 28)
    cen.writeUInt16LE(0, 30)             // extra
    cen.writeUInt16LE(0, 32)             // comment
    cen.writeUInt16LE(0, 34)             // disk start
    cen.writeUInt16LE(0, 36)             // internal attrs
    cen.writeUInt32LE(0, 38)             // external attrs
    cen.writeUInt32LE(offset, 42)        // local header offset
    central.push(Buffer.concat([cen, nameBuf]))

    offset += local.length + nameBuf.length + data.length
  }

  const centralBuf = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...chunks, centralBuf, end])
}
