// Hex.js
//
// ECMAScript 6

// Hexes
//
// The hex coordinate system uses a skewed x, y coordinates, where increasing whole values of y are
// visually are below the previous value of y, and increasing values of x are above and to the right
// of the previous value of x.
class Hex {
    // A constructor which initializes itself using json data
    // given by a call to "dump"
    constructor(json) {
        if (json) {
            this.x = json.x;
            this.y = json.y;
        }
    }

    // Callback when the interior of a hexagon is clicked
    click() {
        console.log("click", this);
    }

    // Callback when the edge of a hexagon is clicked
    // dx and dy represent the offset of the hex bordering
    // the edge that was clicked
    edgeClick(dx, dy) {
    }

    // A callback that returns the HTML of svg elements representing a hex edge.
    // dx and dy are the offset representing the edge being rendered.
    // For example, if dx and dy are both 1, the lower right edge is being rendered
    // where the origin of the elements returned by this function would coincide with
    // the rightmost vertex of the hexagon, and ascending y values would be closer to
    // the center of the hexagon.
    renderEdge(dx, dy) {
    }

    // A callback that returns the HTML of svg elements representing this
    // hexagon's body.
    //
    // width and height are supplied, representing a rectangle that would contain
    // this hexagon, with the origin of the rendered region lying beyond the hexagon
    // to the upper left. The rendered region will be clipped to the hexagon.
    renderHex(width, height) {
    }
    
    // Asks the map containing this hex to redraw it
    draw() {
        if (this.map) {
            this.map.draw();
        }
    }

    // Returns object information for serialization or re-initialization
    // Included information is the x, y coordinate and a string
    // representing the class name
    dump() {
        return { x : this.x, y : this.y, type : this.constructor.name };
    }

    // A callback to produce a new instance of a cell that will occupy
    // the x, y coordinate of the current cell in the next state of the
    // automaton.
    // 
    // The base class implementation simply returns a copy of the current cell.
    next(neighbors) {
        return new this.constructor(this);
    }
}

HexMap = function(svgSelector, props) {
    var _radius = 60;
    var _dRow = 120;
    var _dColX = 180;
    var _dColY = 180;
    var _offsetX = 0;
    var _offsetY = 0;
    var _edge = 10;
    var _map = { };
    var _trapezoid = "";
    var _innerHex = "";
    var _svg = null;
    var _hex = Hex;
    var _gridVertical = "";
    var _gridDiagonal = "";

    this.constructors = { "Hex" : Hex },
    this.autodraw = true;
    this.edgeClicks = false;
    this.hexClicks = true;
    this.renderEdges = false;
    this.renderHexes = true;
    this.drawGrid = false;

   // radius property, radius or edge length of hexagon
    Object.defineProperty(HexMap.prototype, 'radius', {
        get : function() { return _radius; },
        set : function(val) { _radius = val; _recompute(); if (this.autodraw) this.draw(); }
    });

    // edge property, interior width of hexagon for click detection or edge rendering
    Object.defineProperty(HexMap.prototype, 'edge', {
        get : function() { return _edge; },
        set : function(val) { _edge = val; _recompute(); if (this.autodraw) this.draw(); }
    });

    // hex property, prototype of hexes for building new hex maps
    Object.defineProperty(HexMap.prototype, 'hex', {
        get : function() { return _hex; },
        set : function(val) { _hex = val; }
    });

 

    // Build outside hex path
    function _buildHexString() {
        var height = _offsetY; 
        var halfRad = _radius / 2;
        return "M " + -halfRad + " " + -height + " L " + halfRad + " " + -height + " L " + _radius + " 0 " + " L " + halfRad + " " + height + " L " + -halfRad + " " + height + " L " + -_radius + " 0 Z"; 
    }

    // Build translation for a hex from hex coordinate to screen position
    function _translate(d) {
        var translate = "translate(" + Math.floor(d.x * _dColX + _offsetX) + " " + Math.floor(d.y * _dRow + d.x * _dColY + _offsetY) + ")";
        return translate;
    }

    // Build trapezoid path for edge click detection
    function _makeTrapezoid() {
        return "M 0 " + _edge + " L " + Math.floor(_edge / 2.2) + " 0 L " + Math.floor(_radius - _edge / 2.2) + " 0 L " + _radius + " " + _edge + " Z "; 
    }

    // Build inside hex path for center click detection
    function _makeInnerHex() {
        var rad = _radius - _edge;
        var string = "M " + rad + " 0 ";
        for (var deg = 60; deg < 360; deg = deg + 60) {
            string += "L " + Math.floor(Math.cos(deg * Math.PI / 180) * rad) + " " + Math.floor(Math.sin(deg * Math.PI / 180) * -rad) + " ";
        }
        string += "Z";
        return string;
    }

    // Build grid vertical path
    function _makeGridVertical() {
        return "M 0 " + _dColY + " L 0 " + -_dColY;
    }

    function _makeGridDiagonal() {
        return "M " + -_radius + " " + Math.floor(_radius / 2)  + " L " + _radius + " " + Math.floor(-_radius / 2);
    }
    // Force recomputation of constants, upon edge or radius changes
    function _recompute() {
        _dRow = _radius * Math.sqrt(3);
        _dColX = _radius * 1.5;
        _dColY = -_radius / 2 * Math.sqrt(3);
        _offsetX = _radius;
        _offsetY = _radius / 2 * Math.sqrt(3);
        _hexString = _buildHexString();
        _trapezoid = _makeTrapezoid();
        _innerHex = _makeInnerHex();
        _gridVertical = _makeGridVertical();
        _gridDiagonal = _makeGridDiagonal();
    }

   // Returns an array of neighboring cells
    // Each array element is an object with fields "dx" and "dy" representing
    // the offset of the neighbor and field "hex" containing the neighbor
    HexMap.prototype.neighbors = function(x, y) {
        var result = [];
        for (var i in _offsets) {
            var hex = this.get(x + _offsets[i].dx, y + _offsets[i].dy);
            if (hex) {
                result.push({ dx : _offsets[i].dx, dy : _offsets[i].dy, hex : hex});
            }
        }
        return result;
    }

    // Returns an array of all hexes
    HexMap.prototype.toArray = function() {
        var hexes = [ ];
        for (var key in _map) {
            hexes.push(_map[key]);
        }
        return hexes;
    }

   // Initializes a rectangular configuration for the hex map, using the specified hex prototype
    HexMap.prototype.buildRect = function(width, height) {
        for (var i = 0; i < height; i++) {
            for (var j = 0; j < (i + 1) * 2 - 1 && j < width; j++) {
                this.set(j, i, new _hex());
            }
        }
        var y = height;
        for (var i = 1; i < width; i = i + 2) {
            for (var j = i; j < width; j++) {
                this.set(j, y, new _hex());
            }
            y = y + 1;
        }
        if (this.autodraw) this.draw();
    }
    
    // Returns a hex in the map, or undefined if an invalid coordinate was specified
    HexMap.prototype.get = function(x, y) {
        var key = x + "," + y;
        if (key in _map) {
            return _map[key];
        } else {
            return undefined;
        }
    }

    // Sets a map cell to the given hex
    HexMap.prototype.set = function(x, y, hex) {
        var key = x + "," + y;
        if (hex) {
            hex.x = x;
            hex.y = y;
            hex.map = this;
            _map[key] = hex;
        } else {
            console.log("deleted!");
            delete _map[key];
        }
        if (this.autodraw) this.draw();
    }

    var _offsetDict = { 
        "1,0" : 30,
        "0,-1" : 90,
        "-1,-1" : 150,
        "-1,0" : 210,
        "0,1" : 270,
        "1,1" : 330
    };

    var _offsets = [ { dx : 1, dy : 0 }, { dx : 0, dy : -1 }, { dx : -1, dy : -1 }, { dx : -1, dy: 0 }, { dx : 0, dy : 1 }, { dx : 1, dy : 1 }];

    // Given an offset, returns the degree facing of the offset
    // For example, if dx is 1 and dy is 0, 30 degrees is returned
    HexMap.prototype.offsetToDegrees = function(dx, dy) {
        return _offsetDict[dx + ","+ dy];
    }

    // Loads a HexMap from a JSON and a dictionary. 
    HexMap.prototype.fromJson = function(json) {
        var saveDraw = this.autodraw;
        this.autodraw = false;
        _svg.selectAll("g").remove();
        for (var cell in json) {
            var hexClass = this.constructors[json[cell].type];
            if (hexClass == undefined) {
                throw new Error(json[cell].type + " does not appear in constructors dictionary: ", this.constructors);
            }
            this.set(json[cell].x, json[cell].y, new hexClass(json[cell]));
        }
        this.autodraw = true;
        if (this.autodraw) this.draw();
    }

    // Exports the current hexmap data as a JSON, serializing any data in each Hex
    HexMap.prototype.toJson = function() {
        var result = { };
        for (var key in _map) {
            result[key] = _map[key].dump();
        }
        return result;
   }

    // Re-renders the SVG of the hex map
    HexMap.prototype.draw = function() {
         //Clear previous svg elements
        _svg.select("defs").remove();
        _svg.append("defs")
            .append("clipPath")
            .attr("id", "hexPath")
            .append("path")
            .attr("d", _hexString);

        // Create data binding 
        var dataSelect = _svg.selectAll("g")
            .data(this.toArray(), function(d) { return d; });

        // On new data element, create a group representing the hex
        // and merge it
        dataSelect
            .enter()
            .append("g")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; })
            .attr("transform", _translate)
            .attr("clip-path", "url(#hexPath)")
        // If data is missing, remove the associated element
        dataSelect.exit().remove();

        // Take all the groups are currently in the HexMap and decorate them...
        var groups = _svg.selectAll("g");

        groups.append("g")
            .attr("hex-role", "border")
            .append("path")
            .attr("d", _hexString)
            .attr("stroke", "black")
            .attr("fill", "none")
            .attr("stroke-width", 3)
            .attr("pointer-events", "visible")
            .merge(dataSelect);

        // Render hexagon background
        if (this.renderHexes) {
            groups.append("g")
                .attr("hex-role", "render-hex")
                .attr("transform", "translate(" + -_radius + " " + Math.floor(_dColY) + " ) ")
                .html(function(d) { return d.renderHex(_radius * 2, _dRow ); });
        }
        // Render Hex edges
        if (this.renderEdges) {
            var edgeGroup = groups.append("g");
            edgeGroup.attr("hex-role", "edges")
            for (var i in _offsets) {
                edgeGroup.append("g")
                    .attr("transform", "rotate(" + Math.floor(-1 * (-90 + this.offsetToDegrees(_offsets[i].dx, _offsets[i].dy))) + ") translate(" + Math.floor(-_radius / 2)  + " " + _dColY + ") ")
                    .attr("dx", _offsets[i].dx)
                    .attr("dy", _offsets[i].dy)
                    .attr("hex-role", "render-edge")
                    .html(function(d) { return d.renderEdge(parseInt(this.getAttribute("dx")), parseInt(this.getAttribute("dy"))); });
            }
        }

        // Render click listener group
        if (this.edgeClicks || this.hexClicks) {
            var clickGroup = groups.append("g");
            clickGroup.attr("hex-role", "click-zones");
        }

        // Render edge click regions
        if (this.edgeClicks) {
            for (var i in _offsets) {
                clickGroup.append("path")
                    .attr("blah", "blah")
                    .attr("d", _trapezoid)
                    .attr("transform", "rotate(" + Math.floor(-1 * (90 + this.offsetToDegrees(_offsets[i].dx, _offsets[i].dy))) + ") translate(" + -_radius / 2 + " " + -_dColY + ") translate(0 " + -_edge + ")")
                    .attr("fill", "none")
                    .attr("dx", _offsets[i].dx)
                    .attr("dy", _offsets[i].dy)
                    .attr("pointer-events", "visible")
                    .attr("hex-role", "edge-click-zone")
                    .on("click", function(d, i) { d.edgeClick( parseInt(this.getAttribute("dx")), parseInt(this.getAttribute("dy")) ); });
            }
        }

        // Render inside hex click region
        if (this.hexClicks) {
            clickGroup.append("path")
                .attr("d", _innerHex)
                .attr("stroke", "none")
                .attr("pointer-events", "visible")
                .attr("fill", "none")
                .attr("hex-role", "hex-click-zone")
                .on("click", function(d, i) { d.click.apply(d); });
        }   

        // Render a grid for coordinate system.
        // Not very accurate right now, but really only for debugging purposes
        if (this.drawGrid) {
            var grid = groups.append("g")
                .attr("hex-role", "grid");
            grid.append("text")
                .attr("text-anchor", "end")
                .attr("font-size", Math.floor(_radius / 4))
                .attr("transform", "translate(-3 " + Math.floor(-radius / 6) + ")" )
                .text( function(d) { return "(" + d.x + ", " + d.y + ")" } );
            grid.append("path")
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("d", _gridVertical);
            grid.append("path")
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("d", _gridDiagonal);
        }
    }

    // Creates the "next state" of the automaton by calling each
    // cell's "next" function (passing its current neighbors to the cell)
    // and storing the dump of the next cell in a json object.
    // The json object returned would be the equivalent of creating
    // the next state and calling the toJson() function.
    HexMap.prototype.next = function() {
        var saveDraw = this.autodraw;
        this.autodraw = false;
        var nextMap = { };
        var now = new Date().getTime();
        for (var key in _map) {
            current = _map[key];
            var newHex = current.next(this.neighbors(current.x, current.y));
            if (!newHex.x) {
                newHex.x = current.x;
            }
            if (!newHex.y) {
                newHex.y = current.y;
            }
            nextMap[key] = newHex.dump();
        }
        this.autodraw = saveDraw;
        return nextMap;
    }

    _svg = d3.select(svgSelector);

    // Grab user supplied properties
    if (props) {
        for (var key in props) {
            // Union the constructors dictionary with the default constructors dictionary
            if (key === "constructors") {
                var userdict = props.constructors;
                for (var dict in userdict) {
                    this.constructors[dict] = userdict[dict];
                }
            } else {
                this[key] = props[key];
            }
        }
    }
    _recompute();
    if (this.autodraw) this.draw();
}
