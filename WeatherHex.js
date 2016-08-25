class WeatherHex extends Hex {
    // A constructor that loads from json and sets any member variables
    constructor(json) {
        super(json);
        $(document).on('hex.update', function(event, data) {
            if (data.x == this.x && data.y == this.y) {
                this.update(data);
            }
        });
    }

    update(data) {
    }

    // Click listener. Toggles the "alive" state and requests a redraw    
    click() {
        console.log(mode);
        this.draw();
    }

    // Serialization to JSON. Dump everything from the parent class
    // and add the "alive" member variable
    dump() {
        var result = super.dump();
        result.alive = this.alive;
        return result;
    }

    // Callback that should return a new cell representing
    // the state of this cell in the next generation
    // 
    // In this example, use Conway-esque rules based on
    // overcrowding or loneliness
    next(neighbors) {
        var neighborCount = 0;
        for (var i in neighbors) {
            // Get hex field of a neighbor entry
            var hex = neighbors[i].hex;
            // Test to see if it's alive
            if (hex instanceof ConwayHex && hex.alive) {
                neighborCount++;
            }
        }
        if (neighborCount <= lonely || neighborCount >= crowded) {
            return new ConwayHex({ alive : false });
        } else {
            return new ConwayHex({ alive : true });
        }
    }

    // Create a large rectangular background. The background is
    // transparent if the cell isn't "alive", and filled with
    // steel blue if the cell is "alive"
    renderHex(width, height) {
        var g = d3.select(document.createElement("g"));
        g.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", this.alive ? "steelblue" : "none");
        return g.html();
    }

    // Render a rainbow border around the Hexagon
    //
    // To see this example, add renderEdges : true to the properties
    // initializer object.
    renderEdge(dx, dy) {
        var g = d3.select(document.createElement("g"));
        var pair = dx + "," + dy;
        var fill = "";
        switch(pair) {
            case "1,0" : fill = "red"; break;
            case "0,-1" : fill = "orange"; break;
            case "-1,-1" : fill = "yellow"; break;
            case "-1,0" : fill = "green"; break;
            case "0,1" : fill = "blue"; break;
            case "1,1" : fill = "purple"; break;
        }
        g.append("rect")
            .attr("width", radius)
            .attr("height", edge)
            .attr("fill", fill);
        return g.html();
    }

 
}


