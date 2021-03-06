var http = require('http'),
  passport = require('passport'),
  express = require('express'),
  MongoStore = require('connect-mongo')(express),
  graoExpress = express(),
  kernel = new (require('./src/core/GraoKernel'))({
            config: require('./../../config/prod'), 
            passport: passport,
            graoExpress: graoExpress, 
            express: express}),
  servers = new Array(),
  i18n = require('i18n');

var graoJS = function() {
  kernel.logger.info('Setting global configs...');
  
  i18n.configure({
      locales: ['en', 'pt-br'],
      cookie: 'locale',
      defaultLocale: 'en',
      directory: kernel.config.locales
  });

  graoExpress.configure(function(){
    graoExpress.set('views', kernel.config.bundles);
    graoExpress.set('view engine', 'jade');
    graoExpress.enable('jsonp callback');
    graoExpress.use(express.methodOverride());
    graoExpress.use(i18n.init);
    graoExpress.use(express.favicon());
    // https://github.com/evilpacket/helmet
    // https://blog.liftsecurity.io/2012/12/07/writing-secure-express-js-apps
    //graoExpress.use(express.logger('dev'));
    //graoExpress.use(express.bodyParser()); // Insecure and deprecated 
    //graoExpress.use(express.urlencoded());
    //graoExpress.use(express.multipart({defer: true})); // https://github.com/andrewrk/node-multiparty
    graoExpress.use(express.json());
    graoExpress.use(express.cookieParser());
    graoExpress.use(express.session({
      secret: 'FIXME AND RAND THIS',
      store: new MongoStore({ db: 'grao' })
    }));
    graoExpress.use(passport.initialize());
    graoExpress.use(passport.session());
    //graoExpress.use(express.compress());

    kernel.publics.enable({
      express: express, 
      graoExpress: graoExpress, 
      event: kernel.event, 
      config: kernel.config,
      loader: kernel.loader
    });
    
    graoExpress.use(graoExpress.router);
  });

// development only
/*if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
*/

  kernel.routes();
  
  this.kernel = kernel;
  this.servers = servers;
  
  this.start = function() {
    kernel.logger.info('graoJS Starting...');
    kernel.logger.info('Open in your browser:');

    if (process.env.PORT != undefined) {
      servers.push(graoExpress.listen(process.env.PORT));
      kernel.logger.info('http://localhost:' + process.env.PORT);
    } else {
      for(portIndex in kernel.config.ports)
      {
        servers.push(graoExpress.listen(kernel.config.ports[portIndex]));
        kernel.logger.info('http://localhost:' + kernel.config.ports[portIndex]);
      }
    }
  };
  
  this.stop = function() {
    kernel.logger.info('graoJS Shutdown...');
    for(serverIndex in servers) {
      servers[serverIndex].close();
      delete servers[serverIndex];
    }
    servers = new Array();
  };
  
  this.restart = function() {
    this.stop();
    this.start();
  };
  
  this.status = function() {
    kernel.logger.info('graoJS Status...');
    kernel.logger.info('Number of servers: '+servers.length);
  };
};

module.exports = exports = graoJS;