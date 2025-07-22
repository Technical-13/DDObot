const chalk = require( 'chalk' );
const zlib = require( 'zlib' );
const { ApplicationCommandType, Colors, EmbedBuilder, InteractionContextType } = require( 'discord.js' );
const getGuildConfig = require( '../../functions/getGuildDB.js' );
const userPerms = require( '../../functions/getPerms.js' );
const strScript = chalk.hex( '#FFA500' ).bold( './slashCommands/info/color.js' );

const getRand = ( min, max ) => Math.floor( Math.random() * ( max - min + 1 ) + min );

function getValidColor( colorString ) {
  const colorData = { raw: colorString };
  colorString = colorString.toString().toLowerCase();
  if ( colorString == 'random' ) {
    colorData.red = getRand( 0, 255 );
    colorData.green = getRand( 0, 255 );
    colorData.blue = getRand( 0, 255 );
  }
  const colorNameHex = {};
  Object.entries( Colors ).map( color => { colorNameHex[ color[ 0 ].toLowerCase() ] = color[ 1 ].toString( 16 ).replace( '0x', '' ); } );
  const colorNames = Object.keys( colorNameHex );
  if ( colorNames.includes( colorString ) ) {
    const rawHex = colorNameHex[ colorString ];
    colorData.red = parseInt( rawHex.substr( 0, 2 ) );
    colorData.green = parseInt( rawHex.substr( 2, 2 ) );
    colorData.blue = parseInt( rawHex.substr( 4, 2 ) );
  }
  const rgbRegExp = new RegExp( '(?:rgba?)\\((\\s*[\\d]{1,3}%?,?\\s*)(\\s*[\\d]{1,3}%?,?\\s*)(\\s*[\\d]{1,3}%?,?\\s*)(?:[01]\\.?[\\d]{1,2}|[\\d]{1,3}%?)?\\s*\\);?', 'i' );
  if ( rgbRegExp.test( colorString ) ) {
    const rawArray = colorString.match( rgbRegExp );
    const rawRed = parseInt( rawArray[ 1 ].replace( /,/g, '' ).trim() );
    const rawGreen = parseInt( rawArray[ 2 ].replace( /,/g, '' ).trim() );
    const rawBlue = parseInt( rawArray[ 3 ].replace( /,/g, '' ).trim() );
    colorData.red = ( rawRed.endsWith( '%' ) ? Math.round( parseFloat( rawRed ) * 2.55 ) : parseInt( rawRed ) );
    colorData.green = ( rawGreen.endsWith( '%' ) ? Math.round( parseFloat( rawGreen ) * 2.55 ) : parseInt( rawGreen ) );
    colorData.blue = ( rawBlue.endsWith( '%' ) ? Math.round( parseFloat( rawBlue ) * 2.55 ) : parseInt( rawBlue ) );
    } );
  }
  const hexRegExp = new RegExp( '(?:#|0x)?([0-9A-F]{3}|[0-9A-F]{6})', 'i' );
  if ( hexRegExp.test( colorString ) ) {
    const rawArray = colorString.match( hexRegExp );
    colorData.red = parseInt( rawArray[ 1 ] );
    colorData.green = parseInt( rawArray[ 2 ] );
    colorData.blue = parseInt( rawArray[ 3 ] );
  }
  colorData.hex = colorData.red.toString( 16 ) + colorData.green.toString( 16 ) + colorData.blue.toString( 16 );
  colorData.integer = parseInt( '0x' + colorData.hex );
  colorData.hex = '#' + colorData.hex;

  if ( Object.keys( colorData ).length >= 3 ) { return false; }
  return colorData;
}

function createChunk( type, data ) {
    const typeBuffer = Buffer.from( type );
    const dataLength = data ? data.length : 0;
    const chunkData = data || Buffer.alloc( 0 );
    // Calculate CRC over chunk type and chunk data
    const crc = zlib.crc32( Buffer.concat( [ typeBuffer, chunkData ] ) );
    const crcBuffer = Buffer.alloc( 4 );
    crcBuffer.writeUInt32BE( crc, 0 );// CRC needs to be in big-endian format
    // Construct the chunk: length, type, data, CRC
    const lengthBuffer = Buffer.alloc( 4 );
    lengthBuffer.writeUInt32BE( dataLength, 0 );
    return Buffer.concat( [ lengthBuffer, typeBuffer, chunkData, crcBuffer ] );
}

function generateSolidColorPNG( { r = 255, g = 255, b = 255, a = 255, width = 1, height = 1 } = {} ) {
    const bitDepth = 8;// 8 bits per color component
    const colorType = 6;// Truecolor with alpha ( RGBA )
    const signature = Buffer.from( [ 137, 80, 78, 71, 13, 10, 26, 10 ] );// PNG signature
    // IHDR chunk ( Image Header )
    const ihdrData = Buffer.alloc( 13 );
    ihdrData.writeUInt32BE( width, 0 );
    ihdrData.writeUInt32BE( height, 4 );
    ihdrData.writeUInt8( bitDepth, 8 );
    ihdrData.writeUInt8( colorType, 9 );
    ihdrData.writeUInt8( 0, 10 );// Compression method ( 0 = deflate )
    ihdrData.writeUInt8( 0, 11 );// Filter method ( 0 = adaptive )
    ihdrData.writeUInt8( 0, 12 );// Interlace method ( 0 = no interlace )
    const ihdrChunk = createChunk( 'IHDR', ihdrData );
    // IDAT chunk ( Image Data )
    // Each scanline starts with a filter type byte ( 0 for "None" )
    // Then the pixel data ( RGBA for each pixel )
    const bytesPerPixel = 4; // R, G, B, A
    const scanlineLength = width * bytesPerPixel;
    const unfilteredScanline = Buffer.alloc( 1 + scanlineLength );// Filter byte + pixel data
    unfilteredScanline.writeUInt8( 0, 0 );// Filter type 0: None
    for ( let i = 0; i < width; i++ ) {
        const offset = 1 + ( i * bytesPerPixel );// Skip filter byte, then iterate for each pixel
        unfilteredScanline.writeUInt8( r, offset );
        unfilteredScanline.writeUInt8( g, offset + 1 );
        unfilteredScanline.writeUInt8( b, offset + 2 );
        unfilteredScanline.writeUInt8( a, offset + 3 );
    }
    // Duplicate the scanline for all rows to make it a solid color image
    const rawPixelData = Buffer.concat( Array( height ).fill( unfilteredScanline ) );
    // Compress the pixel data using zlib deflate
    const compressedPixelData = zlib.deflateSync( rawPixelData );
    const idatChunk = createChunk( 'IDAT', compressedPixelData );
    // IEND chunk ( Image Trailer )
    const iendChunk = createChunk( 'IEND', Buffer.alloc( 0 ) );// Empty data field
    // Combine all chunks into a single PNG buffer
    const pngBuffer = Buffer.concat( [ signature, ihdrChunk, idatChunk, iendChunk ] );
    // Encode the PNG buffer to base64 and create the data URI
    return `data:image/png;base64,${pngBuffer.toString( 'base64' )}`;
}

module.exports = {
  name: 'color',
  description: 'Get information about a color.',
  type: ApplicationCommandType.ChatInput,
  contexts: [ InteractionContextType.Guild ],
  group: 'info',
  options: [/* color //*/
    { type: 3, name: 'color', description: 'Color you wish to get information for.', required: true }
  ],
  cooldown: 1000,
  run: async ( client, interaction ) => {
    await interaction.deferReply( { ephemeral: true } );
    const { channel, guild, options, user: member } = interaction;
    const { isGlobalBlacklisted, content } = await userPerms( member, guild );
    if ( content ) { return interaction.editReply( { content: content } ); }

    try {
      const rawColor = options.getString( 'color', true );
      const color = getValidColor( rawColor );
      if ( !color ) { return interaction.editReply( { content: '`' + rawColor + '` is not a valid color.' } ); }
      const colorEmbed = new EmbedBuilder()
        .setTitle( 'Information about color string: `' + color.raw + '`' )
        .setColor( color.integer )
        .setThumbnail( generateSolidColorPNG( { r: color.red, g: color.green, b: color.blue } ) )
        .setTimestamp();
      return interaction.editReply( { content: '`' + color + '` is a valid color.' } );
    }
    catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', strScript, errObject.stack ); }
  }
};