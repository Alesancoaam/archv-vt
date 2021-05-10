require( "dotenv" ).config();

const multer        = require( "multer" );
const path          = require( "path" );
const fs            = require( "fs" );
const { isEmpty }   = require( "../../utils" );
const multerConfig  = {

    dest: path.resolve( process.env.FILE_PATH ),
    storage: multer.diskStorage( {

        destination: async ( req, arquivo, cb ) =>{

            const { idAplicacao, idModulo, idTela, idRegistro } = req.query;
            const estruturaDaPasta = {
                aplicacao: isEmpty( idAplicacao ) ? null : idAplicacao, 
                modulo: idModulo,
                tela: isEmpty( idTela ) ? null : idTela,
                registro: idRegistro
            };

            await verificaNCriaEstruturaDePasta( estruturaDaPasta )

            .then( result =>{

                cb( null, path.resolve( result ) );

            } )
            .catch( error =>{ cb( new Error( `não foi possível criar a estrutura de pastas para armazenar o arquivo.` ) ) } );

        },
        filename: ( req, arquivo, cb ) =>{

            let nomeArquivo = arquivo.originalname;
            let comAcento = 'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÖÔÚÙÛÜÇ´`^¨~';    
            let semAcento = 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC     ';

            for( let letra in nomeArquivo ){

                for( letra1 in comAcento ){

                    if( nomeArquivo[ letra ] === comAcento[ letra1 ] ){

                        nomeArquivo = nomeArquivo.replace( nomeArquivo[ letra ], semAcento[ letra1 ] );

                    }

                }

            }

            nomeArquivo = nomeArquivo.replace( /\s/g, "" );

            cb( null, nomeArquivo );

        }

    } ),
    fileFilter: ( req, arquivo, cb ) =>{

        const allowedMimes = [ ...process.env.MIMES_ALLOWED.split( "," ) ];

        if( allowedMimes.includes( arquivo.mimetype ) ){
            
            cb( null, true );

        } else{

            cb( new Error( `extensão de arquivo [${ arquivo.mimetype }] não permitida!` ) );

        }

    }

}

const verificaNCriaEstruturaDePasta = ( estruturaDaPasta ) =>{

    return new Promise( ( resolve, reject ) =>{

        try{

            let newPath = process.env.FILE_PATH;

            newPath = estruturaDaPasta.aplicacao !== null ? path.join( newPath, `aplicacao-${estruturaDaPasta.aplicacao}` ) : newPath;
            newPath = path.join( newPath, `modulo-${estruturaDaPasta.modulo}` );
            newPath = estruturaDaPasta.tela !== null ? path.join( newPath, `tela-${estruturaDaPasta.tela}` ) : newPath;
            newPath = path.join( newPath, `registro-${estruturaDaPasta.registro}` );

            fs.mkdirSync( newPath, { recursive: true } );

            if( fs.existsSync( newPath ) ) resolve( newPath );
            else throw( `Não foi possível criar a pasta!` );

        } catch( error ){ reject( error ) }

    } );

}

module.exports = multerConfig;