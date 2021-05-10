require( "dotenv" ).config();

const yup           = require( "yup" );
const multer        = require( "multer" );
const multerConfig  = require( "../../config/multer" );
const path          = require( "path" );
const fs            = require( "fs" );
const { isEmpty }   = require( "../../utils" );
const { verificaNCriaEstruturaDePastas, criaNSubstituiArquivos, procuraArquivoECodificaBase64, excluirArquivos } = require( "../../config/file" );

const adicionar = ( req, res ) =>{
    
    try {

        const schema = yup.object().shape( {
            idAplicacao: yup.string().notRequired().nullable( true ).test( "validacaoNumerico", "idAplicacao não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idModulo: yup.string().required().test( "validacaoNumerico", "idModulo não é um número válido!", ( value ) => !isNaN( value ) ),
            idTela: yup.string().notRequired().nullable( true ).test( "validacaoNumerico", "idTela não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idRegistro: yup.string().required().test( "validacaoNumerico", "idRegistro não é um número válido!", ( value ) => !isNaN( value ) )
        } );
        const { idAplicacao, idModulo, idTela, idRegistro } = req.query;
        const upload = multer( multerConfig ).array( "arquivo", 12 );

        schema.validate( { idAplicacao, idModulo, idTela, idRegistro }, { strict: true } )

        .then( async() => {

            await upload( req, res, function( err ){

                if( !isEmpty( req.files ) ){

                    if( !( err instanceof multer.MulterError ) && !err ){
                    
                        let linkExterno = `http://${process.env.EXT_IP}:${process.env.PORT}/archiver/v1/arquivo/${req.files[ 0 ].filename}?`;
                        linkExterno = isEmpty( idAplicacao ) ? linkExterno : `${linkExterno}&idAplicacao=${idAplicacao}`
                        linkExterno += `&idModulo=${idModulo}`;
                        linkExterno = isEmpty( idTela ) ? linkExterno : `${linkExterno}&idTela=${idTela}`;
                        linkExterno += `&idRegistro=${idRegistro}`;
    
                        return res.status( 200 ).send( { nome: req.files[ 0 ].filename, linkExterno: linkExterno } );
            
                    } else{
            
                        return res.status( 400 ).send( { error: true, message: `Ocorreu um erro ao fazer o upload da imagem! ${ err }` } );
            
                    }

                } else{

                    return res.status( 400 ).send( { error: true, message: `Nenhum arquivo enviado!` } );

                }
        
            } );

        } )
        .catch( ( error ) => res.status( 400 ).send( { error: true, message: error.errors || error.message } ) );
        
    } catch( error ){

        return res.status( 500 ).send( error.message );
        
    }

};

const adicionar64 = ( req, res ) =>{

    try{

        const schema = yup.object().shape( {
            idAplicacao: yup.number().notRequired().nullable( true ).test( "validacaoNumerico", "idAplicacao não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idModulo: yup.number().integer().positive().required(),
            idTela: yup.number().notRequired().nullable( true ).test( "validacaoNumerico", "idTela não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idRegistro: yup.number().integer().positive().required(),
            arquivo: yup.object().shape( {
                nome: yup.string().required().min( 3 ).max( 20 ),
                tamanho: yup.number().integer().positive().required(),
                data: yup.string().required().test( function ( value ){
    
                    let a = value.match( /^data:([A-Za-z-+\/]+);base64,(.+)$/ );
                    let allowedMimes = [ "image/jpeg", "image/png", "application/pdf",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "application/msword"
                    ];
    
                    a = Array.isArray( a ) ? a: [];
    
                    if( !a.length === 3 ) return this.createError( { message: `Content-type do arquivo [${this.parent.nome}] não é válido!`, path: "data" } ); 
                    if( !allowedMimes.includes( a[ 1 ] ) ) return this.createError( { message: `Tipo de arquivo [${a[ 1 ]}] não é permitido!`, path: "data" } ); else return true;
    
                } )
    
            } ).required()
        } );

        schema.validate( req.body, { strict: true } )

        .then( async() =>{

            const { idAplicacao, idModulo, idTela, idRegistro, arquivo } = req.body;
            const estruturaDaPasta = {
                aplicacao: isEmpty( idAplicacao ) ? null : idAplicacao, 
                modulo: idModulo,
                tela: isEmpty( idTela ) ? null : idTela,
                registro: idRegistro
            };

            await verificaNCriaEstruturaDePastas( estruturaDaPasta )

            .then( async( path ) =>{

                await criaNSubstituiArquivos( path, [ arquivo ] )

                .then( () => res.status( 204 ).send() )
                .catch( ( error ) => res.status( 500 ).send( { error : true, message: error.message } ) );

            } )
            .catch( ( error ) => res.status( 500 ).send( { error: true, message: error.message } ) );

        } )
        .catch( ( error ) => res.status( 400 ).send( { error: true, error: error.errors || error.message } ) );


    } catch( error ){

        return res.status( 500 ).send( { error: true, message: error.message } );

    }

};

const buscarPeloLinkExterno = ( req, res ) =>{

    try{

        const { arquivo } = req.params;
        const schema = yup.object().shape( {
            idAplicacao: yup.string().notRequired().nullable( true ).test( "validacaoNumerico", "idAplicacao não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idModulo: yup.string().required().test( "validacaoNumerico", "idModulo não é um número válido!", ( value ) => !isNaN( value ) ),
            idTela: yup.string().notRequired().nullable( true ).test( "validacaoNumerico", "idTela não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idRegistro: yup.string().required().test( "validacaoNumerico", "idRegistro não é um número válido!", ( value ) => !isNaN( value ) ),
            arquivo: yup.string().required()
        } );
        const { idAplicacao, idModulo, idTela, idRegistro } = req.query;

        schema.validate( { idAplicacao, idModulo, idTela, idRegistro, arquivo }, { strict: true } )

        .then( () => {

            let caminhoDoArquivo = path.resolve( process.env.FILE_PATH );

            caminhoDoArquivo = !isEmpty( idAplicacao ) ? path.resolve( caminhoDoArquivo, `aplicacao-${idAplicacao}` ) : caminhoDoArquivo;
            caminhoDoArquivo = path.resolve( caminhoDoArquivo, `modulo-${idModulo}` );
            caminhoDoArquivo = !isEmpty( idTela ) ? path.resolve( caminhoDoArquivo, `tela-${idTela}` ) : caminhoDoArquivo;
            caminhoDoArquivo = path.resolve( caminhoDoArquivo, `registro-${idRegistro}`, arquivo );

            if( fs.existsSync( caminhoDoArquivo ) ){
    
                return res.status( 200 ).sendFile( caminhoDoArquivo );
    
            } else{
    
                return res.status( 400 ).send( { error: true, message: `Arquivo ${arquivo} não encontrado!` } );
    
            }

        } )
        .catch( ( error ) => res.status( 400 ).send( { error: true, message: error.errors || error.message } ) );

    } catch( error ){

        return res.status( 500 ).send( error.message );

    }

};

const buscarPorNome = ( req, res ) =>{

    try{

        const { arquivo } = req.params;
        const schema = yup.object().shape( {
            arquivo: yup.string().required().test( function( value ){
    
                if( value.indexOf( "." ) === -1 ) return this.createError( { message: `Nome do arquivo [${this.parent.arquivo}] não é válido!` } );
    
                let allowedMimes = [ ...process.env.MIMES_ALLOWED.split( "," ) ];
                let extensao = value.substr( value.lastIndexOf( "." ) + 1 );
    
                if( !allowedMimes.includes( extensao ) ) return this.createError( { message: `Content-type do arquivo [${this.parent.arquivo}] não é válido!` } ); else return true;
    
            } ),
            idAplicacao: yup.string().notRequired().nullable( true ).test( "validacaoNumerico", "idAplicacao não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idModulo: yup.string().required().test( "validacaoNumerico", "idModulo não é um número válido!", ( value ) => !isNaN( value ) ),
            idTela: yup.string().notRequired().nullable( true ).test( "validacaoNumerico", "idTela não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idRegistro: yup.string().required().test( "validacaoNumerico", "idRegistro não é um número válido!", ( value ) => !isNaN( value ) ),
        } );
        const { idAplicacao, idModulo, idTela, idRegistro } = req.query;

        schema.validate( { arquivo, idAplicacao, idModulo, idTela, idRegistro }, { strict: true } )

        .then( async() =>{

            const estruturaDaPasta = {
                aplicacao: isEmpty( idAplicacao ) ? null : idAplicacao, 
                modulo: idModulo,
                tela: isEmpty( idTela ) ? null : idTela,
                registro: idRegistro
            };

            await procuraArquivoECodificaBase64( estruturaDaPasta, arquivo )

            .then( ( result ) => res.status( 200 ).send( result ) )
            .catch( ( error ) => res.status( 400 ).send( { error: true, message: error.message } ) );

        } )
        .catch( ( error ) => res.status( 400 ).send( { error: true, error: error.errors || error.message } ) );

    } catch( error ){

        return res.status( 500 ).send( { error: true, message: error.message } );

    }
    
};

const excluirArquivo = ( req, res ) =>{

    try{
        
        const { arquivo } = req.params;
        const schema = yup.object().shape( {
            arquivo: yup.string().required().test( function( value ){
    
                if( value.indexOf( "." ) === -1 ) return this.createError( { message: `Nome do arquivo [${this.parent.file}] não é válido!`, path: "file" } );
    
                let allowedMimes = [ ...process.env.MIMES_ALLOWED.split( "," ) ];
                let extensao = value.substr( value.lastIndexOf( "." ) + 1 );
    
                if( !allowedMimes.includes( extensao ) ) return this.createError( { message: `Content-type do arquivo [${this.parent.file}] não é válido!`, path: "file" } ); else return true;
    
            } ),
            idAplicacao: yup.string().notRequired().nullable( true ).test( "validacaoNumerico", "idAplicacao não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idModulo: yup.string().required().test( "validacaoNumerico", "idModulo não é um número válido!", ( value ) => !isNaN( value ) ),
            idTela: yup.string().notRequired().nullable( true ).test( "validacaoNumerico", "idTela não é um número válido!", ( value ) => isEmpty( value ) || !isNaN( value ) ),
            idRegistro: yup.string().required().test( "validacaoNumerico", "idRegistro não é um número válido!", ( value ) => !isNaN( value ) ),
        } );
        const { idAplicacao, idModulo, idTela, idRegistro } = req.query;

        schema.validate( { arquivo, idAplicacao, idModulo, idTela, idRegistro }, { strict: true } )

        .then( async() =>{

            const estruturaDaPasta = {
                aplicacao: isEmpty( idAplicacao ) ? null : idAplicacao, 
                modulo: idModulo,
                tela: isEmpty( idTela ) ? null : idTela,
                registro: idRegistro
            };

            await excluirArquivos( estruturaDaPasta, arquivo )

            .then( () => res.status( 204 ).send() )
            .catch( ( error ) => res.status( 400 ).send( { error: true, error: error.message } ) )

        } )
        .catch( ( error ) => res.status( 400 ).send( { error: true, error: error.errors || error.message } ) );

    } catch( error ){

        return res.status( 500 ).send( { error: true, message: error.message } );

    }

};

module.exports = { 
    adicionar,
    adicionar64,
    buscarPeloLinkExterno, 
    buscarPorNome,
    excluirArquivo
};