const chalk = require( 'chalk' );
const zlib = require( 'zlib' );
const { ApplicationCommandType, AttachmentBuilder, Colors, EmbedBuilder, InteractionContextType } = require( 'discord.js' );
const getGuildConfig = require( '../../functions/getGuildDB.js' );
const userPerms = require( '../../functions/getPerms.js' );
const strScript = chalk.hex( '#FFA500' ).bold( './slashCommands/info/color.js' );

function getValidColor( colorString ) {
  const colorData = { raw: colorString };
  colorString = colorString.toString().toLowerCase();
  const colorNameHex = {};
  Object.entries( Colors ).map( color => { colorNameHex[ color[ 0 ].toLowerCase() ] = color[ 1 ].toString( 16 ).replace( '0x', '' ); } );
  const colorNames = Object.keys( colorNameHex );
  const rgbRegExp = new RegExp( '(?:rgba?)\\((\\s*[\\d]{1,3}%?,?\\s*)(\\s*[\\d]{1,3}%?,?\\s*)(\\s*[\\d]{1,3}%?,?\\s*)([01]\\.?[\\d]+|[\\d]+%?)?\\s*\\);?', 'i' );
  const hexRegExp = new RegExp( '(?:#|0x)?([0-9A-F]?[0-9A-F])([0-9A-F]?[0-9A-F])([0-9A-F]?[0-9A-F])([0-9A-F]?[0-9A-F])?', 'i' );
  if ( colorString == 'random' ) {
    colorData.red = getRand( 0, 255 );
    colorData.green = getRand( 0, 255 );
    colorData.blue = getRand( 0, 255 );
    colorData.alpha = 1;
  }
  else if ( colorNames.includes( colorString ) ) {
    const rawHex = colorNameHex[ colorString ];
    colorData.red = parseInt( rawHex.substr( 0, 2 ), 16 );
    colorData.green = parseInt( rawHex.substr( 2, 2 ), 16 );
    colorData.blue = parseInt( rawHex.substr( 4, 2 ), 16 );
    colorData.alpha = 1;
  }
  else if ( rgbRegExp.test( colorString ) ) {
    const rawArray = colorString.match( rgbRegExp );
    const rawRed = rawArray[ 1 ].replace( /,/g, '' ).trim();
    const rawGreen = rawArray[ 2 ].replace( /,/g, '' ).trim();
    const rawBlue = rawArray[ 3 ].replace( /,/g, '' ).trim();
    const rawAlpha = rawArray[ 4 ].trim();
    colorData.red = ( rawRed.endsWith( '%' ) ? Math.round( parseFloat( rawRed ) * 2.55 ) : parseInt( rawRed ) );
    if ( colorData.red < 0 || colorData.red > 255 ) { return false; }
    colorData.green = ( rawGreen.endsWith( '%' ) ? Math.round( parseFloat( rawGreen ) * 2.55 ) : parseInt( rawGreen ) );
    if ( colorData.green < 0 || colorData.green > 255 ) { return false; }
    colorData.blue = ( rawBlue.endsWith( '%' ) ? Math.round( parseFloat( rawBlue ) * 2.55 ) : parseInt( rawBlue ) );
    if ( colorData.blue < 0 || colorData.blue > 255 ) { return false; }
    colorData.alpha = ( rawAlpha.endsWith( '%' ) ? parseFloat( rawAlpha ) / 100 : parseFloat( rawAlpha ) );
    if ( colorData.alpha < 0 || colorData.alpha > 1 ) { return false; }
  }
  else if ( hexRegExp.test( colorString ) ) {
    const rawArray = colorString.match( hexRegExp );
    const rawHex = rawArray[ 0 ].replace( /(0x|#)/, '' );
    if ( rawHex.length != 3 && rawHex.length != 6 && rawHex.length != 8 ) { return false; }
    if ( rawHex.length == 3 ) {
      rawArray[ 1 ] += rawArray[ 1 ];
      rawArray[ 2 ] += rawArray[ 2 ];
      rawArray[ 3 ] += rawArray[ 3 ];
    }
    colorData.red = parseInt( rawArray[ 1 ], 16 );
    if ( colorData.red < 0 || colorData.red > 255 ) { return false; }
    colorData.green = parseInt( rawArray[ 2 ], 16 );
    if ( colorData.green < 0 || colorData.green > 255 ) { return false; }
    colorData.blue = parseInt( rawArray[ 3 ], 16 );
    if ( colorData.blue < 0 || colorData.blue > 255 ) { return false; }
    if ( rawHex.length == 8 ) {
      colorData.alpha = parseInt( rawArray[ 4 ], 16 );
      if ( colorData.alpha < 0 || colorData.alpha > 255 ) { return false; }
      colorData.alpha = Math.round( ( colorData.alpha / 255 ) * 10000 ) / 10000;
    }
  }
  else { return false; }
  colorData.hex = colorData.red.toString( 16 ) + colorData.green.toString( 16 ) + colorData.blue.toString( 16 );
  colorData.integer = parseInt( '0x' + colorData.hex );
  colorData.hex += ( colorData.alpha == 1 ? '' : Math.round( 255 * colorData.alpha ).toString( 16 ) );
  colorData.hex = '#' + colorData.hex;
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
    return pngBuffer;
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
      /* TRON */console.log( 'color: %o', color );/* TROFF */
      const colorBlock = new AttachmentBuilder( generateSolidColorPNG( { r: color.red, g: color.green, b: color.blue, width: 128, height: 128 } ), { name: 'color-block.png' } );
      const colorEmbed = new EmbedBuilder()
        .setTitle( 'Information about color string: `' + color.raw + '`' )
        .setColor( color.integer )
        .setThumbnail( 'attachment://color-block.png' )
        .setTimestamp();//*/
      return interaction.editReply( { content: '`' + color.raw + '` is a valid color.', embeds: [ colorEmbed ], files: [ colorBlock ] } );
    }
    catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', strScript, errObject.stack ); }
  }
};