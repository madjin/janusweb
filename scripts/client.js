elation.require(['engine.engine', 'engine.assets', 'engine.things.light_ambient', 'engine.things.light_directional', 'engine.things.light_point', 'janusweb.janusweb', 'janusweb.chat', 'janusweb.janusplayer', 'janusweb.ui'], function() {

  // If getCurrentScript returns non-null here, then it means we're in release mode
  var clientScript = elation.utils.getCurrentScript();

  elation.extend('janusweb.init', function(args) {
    if (!args) args = {};
    var proto = elation.utils.any(args.protocol, elation.config.get('dependencies.protocol'), document.location.protocol);
    var host = elation.utils.any(args.host, elation.config.get('dependencies.host'), document.location.host);
    var rootdir = elation.utils.any(args.rootdir, elation.config.get('dependencies.rootdir'), document.location.pathname);
    var path = elation.utils.any(args.path, elation.config.get('dependencies.path'), '/');
    var homepage = elation.utils.any(args.homepage, elation.config.get('janusweb.homepage'), document.location.href);
    var container = elation.utils.any(args.container, document.body);
    var fullsize = (container == document.body);

    var fullpath = proto + '//' + host + rootdir;
    if (clientScript) { // && clientScript.src.match(/\/janusweb.js^/)) {
      var parts = clientScript.src.split('/');
      var fname = parts.pop();
      fullpath = parts.join('/') + '/';
      parts.shift();
      parts.shift();
      parts.shift();
      var rootdir = '/';
      if (parts.length > 0) { 
        rootdir += parts.join('/') + '/';
      }

      elation.config.set('dependencies.main', fname);
      elation.config.set('dependencies.rootdir', rootdir);
      elation.config.set('dependencies.host', document.location.host);
      elation.config.set('dependencies.protocol', document.location.protocol);
      elation.config.set('janusweb.datapath', fullpath + 'media/');
      elation.config.set('engine.assets.font.path', fullpath + 'media/fonts/');
    }
    elation.config.set('dependencies.path', fullpath);

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fullpath + 'janusweb.css';
    document.head.appendChild(link);
    elation.html.addclass(document.body, 'dark');
    elation.html.addclass(document.body, 'janusweb');
    var janusweb = elation.janusweb.client({
      append: container, 
      homepage: homepage, 
      shownavigation: args.shownavigation,
      showchat: elation.utils.any(args.showchat, true),
      usevoip: elation.utils.any(args.usevoip, false),
      resolution: args.resolution, 
      url: args.url,
      networking: args.networking,
      autoload: args.autoload,
      urltemplate: args.urltemplate
    });
    return new Promise(function(resolve, reject) {
      elation.events.add(janusweb.engine, 'engine_start', function() { resolve(janusweb); });
    });
  });
  elation.component.add('janusweb.client', function() {
    this.initEngine = function() {
      this.initLoader();

      var hashargs = elation.url();
       
      this.enginecfg.stats = false;

      this.enginecfg.systems = [];
      this.enginecfg.systems.push("controls");
      this.enginecfg.systems.push("physics");
      this.enginecfg.systems.push("ai");
      this.enginecfg.systems.push("world");
      //if (hashargs.admin == 1) {
        this.enginecfg.systems.push("admin");
      //}
      this.enginecfg.systems.push("render");
      this.enginecfg.systems.push("sound");
      this.enginecfg.crosshair = false;
      this.enginecfg.picking = true;

      this.buttons = elation.ui.buttonbar({append: document.body, classname: 'janusweb_ui_buttons'})
      setTimeout(elation.bind(this, function() {
        this.initSharing();
      }), 0);
    }
    this.initWorld = function() {
      var things = this.world.load({
        name: 'janusweb',
        type: 'janusweb',
        properties: {
          corsproxy: elation.config.get('engine.assets.corsproxy'),
          datapath: elation.config.get('janusweb.datapath'),
          homepage: this.args.homepage,
          url: this.args.url,
          showchat: this.args.showchat,
          networking: this.args.networking,
          autoload: this.args.autoload,
          urltemplate: this.args.urltemplate,
        }
      });
      this.janusweb = things.children.janusweb;
      this.player = this.janusweb.spawn('janusplayer', 'player', {
        janus: this.janusweb,
        position: [0,0,0],
        mass: 10,
        movespeed: 5000,
        collidable: true,
        usevoip: this.args.usevoip
      });

      this.shownavigation = elation.utils.any(this.args.shownavigation, true);
      if (this.shownavigation) {
        this.ui = elation.janusweb.ui({append: document.body, client: this});
      }
    }
    this.initLoader = function() {
      var loader = document.getElementsByClassName('engine_loading')[0];
      if (loader) {
        var logo = loader.getElementsByTagName('svg')[0];
        var label = loader.getElementsByClassName('janusweb_loading_status')[0];
        this.loadingscreen = {
          container: loader,
          logo: logo,
          label: label
        };
        elation.events.add(this, 'engine_error', elation.bind(this, this.handleEngineError));
        elation.events.add(this.engine, 'engine_start', elation.bind(this, this.handleEngineStart));
      }
    }
    this.handleEngineStart = function(ev) {
      if (this.loadingscreen) {
        this.loadingscreen.container.parentNode.removeChild(this.loadingscreen.container);
      }
    }
    this.handleEngineError = function(ev) {
      console.log('omg error!', ev);
      if (this.loadingscreen) {
        this.loadingscreen.label.innerHTML = 'Error!';
        elation.html.addclass(this.loadingscreen.container, 'state_error');
        var err = ev.data;
        var msg = err.message + '\n' + err.stack;

        var errordiv = elation.html.create({tag: 'pre', append: this.loadingscreen.container, content: msg, classname: 'janusweb_error'});
      }
    }
    this.showAbout = function() {
      var aboutwin = elation.ui.window({append: document.body, center: true, title: 'About JanusWeb'});
      var frame = elation.ui.iframe({src: 'http://github.com/jbaicoianu/janusweb/', classname: 'janusweb_about'});
      aboutwin.setcontent(frame);
    }
  }, elation.engine.client);
});
