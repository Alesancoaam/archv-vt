require( "dotenv" ).config();

const jwt = require( "jsonwebtoken" );

module.exports = ( req, res, next ) =>{

    const authHeader = req.headers.authorization;

    if( !authHeader ){

        return res.status( 401 ).send( { error: true, message: "Nenhuma token fornecida" } );

    }

    const tkPart = req.headers.authorization.split( " " );

    if( !tkPart.length === 2 ){

        return res.status( 401 ).send( { error: true, message: "Erro na token" } );

    }

    const [ scheme, token ] = tkPart;

    if( !/^Bearer$/i.test( scheme ) ){

        return res.status( 401 ).send( { error: true, message: "Token mal formatada" } );

    }

    jwt.verify( token, process.env.SECRET_KEY, ( error, decoded ) => {

        if( error ){

            return res.status( 401 ).send( { error: true, message: "Token inválida" } )

        }

        req.userId = decoded.userId;
        return next();

    } );

};