const express                   = require( "express" );
const routes                    = express.Router();
const jwtMiddleware             = require( "../middlewares/jwt" );
const basicMiddleware           = require( "../middlewares/basic" );
const arquivoController         = require( "../controllers/arquivo" );

//-----------------------------------------------------------------------------------------------------------------------
// Rotas dos arquivos em formData com autenticação jwt
//-----------------------------------------------------------------------------------------------------------------------
routes.post( "/archiver/v1/arquivo", jwtMiddleware, arquivoController.adicionar );
routes.get( "/archiver/v1/arquivo/:arquivo", jwtMiddleware, arquivoController.buscarPeloLinkExterno );
routes.delete( "/archiver/v1/arquivo/:arquivo", jwtMiddleware, arquivoController.excluirArquivo );

//-----------------------------------------------------------------------------------------------------------------------
// Rotas dos arquivos em base64
//-----------------------------------------------------------------------------------------------------------------------
routes.post( "/archiver/v1/arquivo64", jwtMiddleware, arquivoController.adicionar64 );
routes.get( "/archiver/v1/arquivo64/:arquivo", jwtMiddleware, arquivoController.buscarPorNome );

//-----------------------------------------------------------------------------------------------------------------------
// Rotas dos arquivos em formData com autenticação basic64
//-----------------------------------------------------------------------------------------------------------------------
routes.post( "/archiver/v2/arquivo", basicMiddleware, arquivoController.adicionar );
routes.get( "/archiver/v2/arquivo/:arquivo", basicMiddleware, arquivoController.buscarPeloLinkExterno );

module.exports = routes;