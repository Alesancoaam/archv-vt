require( "dotenv" ).config();

const path  = require( "path" );
const fs    = require( "fs" );

const verificaNCriaEstruturaDePastas = ( estruturaDaPasta ) =>{


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

const criaNSubstituiArquivos = ( filePath, files ) =>{

    let retorno     = true;
    let mensagem    = "";

    return new Promise( ( resolve, reject ) =>{

        try{

            for( let i = 0; i < files.length; i ++ ){

                let a = files[ i ].data.match( /^data:([A-Za-z-+\/]+);base64,(.+)$/ );
                a = Array.isArray( a ) ? a: [];

                if( a.length !== 3 ){

                    retorno     = !retorno;
                    mensagem    = `content-type do arquivo [${files[ i ].nome}] não é válido.`;
                    break;

                }

                let buffer = Buffer.from( a[ 2 ], "base64" );

                let fullPath = path.join( filePath, files[ i ].nome );
                fs.writeFileSync( fullPath, buffer );

                if( !fs.existsSync( fullPath ) ){

                    retorno     = !retorno;
                    mensagem    = `não foi possível salvar o arquivo [${files[ i ].nome}].`;
                    break;

                }

            }

            if( retorno ){

                resolve( true );

            } else{

                throw new Error( `Ocorreu um erro ao fazer o upload. Error: ${mensagem}` );

            }

        } catch( error ){ reject( error.message ) }
        
    } );

}

const procuraArquivoECodificaBase64 = ( estruturaDaPasta, nomeDoArquivo ) =>{

    return new Promise( ( resolve, reject ) =>{

        try{

            let newPath = process.env.FILE_PATH;

            newPath = estruturaDaPasta.aplicacao !== null ? path.join( newPath, `aplicacao-${estruturaDaPasta.aplicacao}` ) : newPath;
            newPath = path.join( newPath, `modulo-${estruturaDaPasta.modulo}` );
            newPath = estruturaDaPasta.tela !== null ? path.join( newPath, `tela-${estruturaDaPasta.tela}` ) : newPath;
            newPath = path.join( newPath, `registro-${estruturaDaPasta.registro}` );

            newPath = path.join( newPath, nomeDoArquivo );

            if( !fs.existsSync( newPath ) ){ throw new Error( `Arquivo [${nomeDoArquivo}] não encontrado no caminho específicado!` ) }

            let file        = fs.readFileSync( newPath );
            let fileExt     = path.extname( nomeDoArquivo );
            let fileStats   = fs.statSync( newPath );
            let fileEncoded = "data:application/pdf;base64," + file.toString( "base64" );

            let resultObj = {
                nome: nomeDoArquivo,
                extensao: fileExt.substr( 1 ),
                tamanho: fileStats[ "size" ],
                data: fileEncoded
            };

            resolve( resultObj );

        } catch( error ){ reject( error.message ) }

    } );

}

const excluirArquivos = ( estruturaDaPasta, nomeDoArquivo ) =>{

    return new Promise( ( resolve, reject ) =>{

        try{

            let newPath = process.env.FILE_PATH;

            newPath = estruturaDaPasta.aplicacao !== null ? path.join( newPath, `aplicacao-${estruturaDaPasta.aplicacao}` ) : newPath;
            newPath = path.join( newPath, `modulo-${estruturaDaPasta.modulo}` );
            newPath = estruturaDaPasta.tela !== null ? path.join( newPath, `tela-${estruturaDaPasta.tela}` ) : newPath;
            newPath = path.join( newPath, `registro-${estruturaDaPasta.registro}` );

            newPath = path.join( newPath, nomeDoArquivo );

            if( !fs.existsSync( newPath ) ){ throw new Error( `Arquivo [${nomeDoArquivo}] não encontrado no caminho específicado!` ) }

            fs.unlinkSync( newPath );

            if( fs.existsSync( newPath ) ){ throw new Error( `Não foi possível excluir o arquivo [${nomeDoArquivo}]!` ); }

            resolve( true );

        } catch( error ){ reject( error.message ) }

    } );

};

module.exports = {
    verificaNCriaEstruturaDePastas,
    criaNSubstituiArquivos,
    procuraArquivoECodificaBase64,
    excluirArquivos
};