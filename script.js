//project specific functions//
        // Function to detect all circular waits and return involved edges
        function detectAllCycleEdges(links) {
            let visited = new Set();    // Tracks nodes that have been fully processed
            let stack = new Set();      // Tracks nodes in the current DFS recursion
            let edgeStack = [];         // Tracks the edges being traversed in the current DFS path
            let allCycleEdges = [];     // To store all the cycles detected
        
            // Helper function to perform DFS and detect cycles
            function dfs(node) {
                if (stack.has(node)) {
                    // Cycle found: return the edges involved in this cycle
                    allCycleEdges.push([...edgeStack]); // Save a copy of the current edge stack
                    return;
                }
                if (visited.has(node)) {
                    // Node has already been fully processed, skip it
                    return;
                }
        
                // Mark the node as visited and add to the current recursion stack
                visited.add(node);
                stack.add(node);
        
                // Traverse all outgoing edges from the current node
                for (let link of links) {
                    if (link.source === node) {
                        // Add the current edge to the edge stack
                        edgeStack.push(link);
                        dfs(link.target); // Continue DFS to the target node
                        // Backtrack: remove the edge from the stack if no cycle found
                        edgeStack.pop();
                    }
                }
                // Backtrack: remove the node from the recursion stack
                stack.delete(node);
            }
            // Start DFS from each node in nodes1
            for (let node of nodes1) {
                dfs(node.id); // Perform DFS starting from the node's ID
            }
            return allCycleEdges; // Return all cycles found
        }
        //function to calculate cycles edges 
        function clac_cycle_edges(){
            let allCycleEdges = detectAllCycleEdges(links1);
            if (allCycleEdges.length > 0) {
                // //console.log("Circular waits detected, edges involved:");
                allCycleEdges.forEach((cycle, index) => {
                    // //console.log(`Cycle ${index + 1}:`, cycle);
                });
            } else {
                // //console.log("No circular waits detected.");
            }
            cycleLinks=[];
            for(let cycle of allCycleEdges){
                for (let link of cycle){
                    cycleLinks.push(link);
                }
            }
        }
        //calculate this when adding new edge or deleting an edge 
        function calc_hold_wait_edges(){
            yellowLinks=[];//empty 
            for(let link of links1){
                const sourceNode = nodes1.find(node => node.id === link.source.id || node.id === link.source);
                const targetNode = nodes1.find(node => node.id === link.target.id || node.id === link.target);
                if(sourceNode.type==="resource" && targetNode.type==="process"){//hold wait can only from resource to process and + process to another resource
                    for (let link1 of links1){
                        if(link.target===link1.source){
                            for(let link2 of links1){
                                if(link2.source===link1.target){
                                    yellowLinks.push(link)
                                    yellowLinks.push(link1)
                                }
                            }
                        }
                        
                    }
                }
                
            }
            // //console.log("Yellow_links calculated : " , yellowLinks);
            
        }
        // Custom force to keep resources within their group
        function forceGroupContainment(alpha) {
            const strength = 0.1;
            nodes.forEach(d => {
                if (d.type === 'resource') {
                    const group = resourceGroups.get(d.group);
                    if (group) {
                        const dx = d.x - group.x;
                        const dy = d.y - group.y;
                        const r = Math.sqrt(dx * dx + dy * dy);
                        const maxR = groupSize / 2 - 20; // Adjusted to keep resources inside
                        if (r > maxR) {
                            d.x = group.x + (dx / r) * maxR;
                            d.y = group.y + (dy / r) * maxR;
                        }
                    }
                }
            });
        }
        function renderGraph() {
        // Group resources
        const groups = d3.group(nodes.filter(d => d.type === 'resource'), d => d.group);
        
        // Update resource groups positions
        groups.forEach((groupNodes, groupId) => {
            if (!resourceGroups.has(groupId)) {
                resourceGroups.set(groupId, {
                    x: width / 2 + (Math.random() - 0.5) * 200,
                    y: height / 2 + (Math.random() - 0.5) * 200
                });
            }
        });

        // Bind resource group data and draw groups
        const group = svg.selectAll(".resource-group")
            .data(Array.from(groups));

        const groupEnter = group.enter()
            .append("g")
            .attr("class", "resource-group");

        groupEnter.append("rect")
            .attr("width", groupSize)
            .attr("height", groupSize)
            .attr("x", -groupSize / 2)
            .attr("y", -groupSize / 2);

        const groupMerge = group.merge(groupEnter)
            .call(d3.drag()
                .on("start", dragstartGroup)
                .on("drag", draggedGroup)
                .on("end", dragendGroup));
        group.exit().remove();

        // Bind link data and draw links      
        const link = svg.selectAll(".link")      
            .data(links);

        link.enter()
            .append("line")
            .attr("class", "link")
            .merge(link)
            .attr("stroke", d => {
                const sourceNode = nodes.find(node => node.id === d.source.id || node.id === d.source);
                const targetNode = nodes.find(node => node.id === d.target.id || node.id === d.target);
                // //console.log("Cheking right now for :" , sourceNode ," -> ", targetNode)
                //CASE 1 hold-wait
                const exists = yellowLinks.some(link => 
                    (link.source.id === sourceNode.id || link.source === sourceNode.id) && 
                    (link.target.id === targetNode.id || link.target === targetNode.id)
                );
                //CASE 2 CIRCULAR-wait
                const exists1 = cycleLinks.some(link => 
                    (link.source.id === sourceNode.id || link.source === sourceNode.id) && 
                    (link.target.id === targetNode.id || link.target === targetNode.id)
                );
                //console.log("exists1 : " , exists1);
                //console.log("exists : " , exists);
                if(exists && (isHold && !isCycle)){return "yellow"}//apply yello to edges if the toggling view on
                else if(exists1 && ( isCycle && !isHold)){return "#00FF00"}//apply green to edges if the toggling view on for cycle 

                else if (sourceNode.type === "resource" && targetNode.type === "process") {
                    return "blue"; // Resource to Process
                }
                else if (sourceNode.type === "process" && targetNode.type === "resource") {
                    return "#FF0000";//return red
                }

            })
            .attr("stroke-width", 2) // Make edges more visible
            .attr("marker-end", d => {
                const sourceNode = nodes.find(node => node.id === d.source.id || node.id === d.source);
                const targetNode = nodes.find(node => node.id === d.target.id || node.id === d.target);
                if (sourceNode.type === "process" && targetNode.type === "resource") {
                    return "url(#arrow-red)"; // Red arrow for process to resource
                } else if (sourceNode.type === "resource" && targetNode.type === "process") {
                    return "url(#arrow-blue)"; // Blue arrow for resource to process
                }
            });
        link.exit().remove()

         //Bind node data and draw nodes
        const node = svg.selectAll(".node")
            .data(nodes);
        
        const nodeEnter = node.enter()
            .append("g")
            .attr("class", d => `node ${d.type}`)
            .on("contextmenu", handleContextMenu);//detects right click on deskop and long-press on mobiles.
        
        // Add square nodes for resources
        nodeEnter.filter(d => d.type === 'resource')
            .append("rect")
            .attr("width", 40)
            .attr("height", 40)
            .attr("x", -20)
            .attr("y", -20)
            .attr("class", "resource-node");
        
        // Add circle nodes for processes
        nodeEnter.filter(d => d.type === 'process')
            .append("circle")
            .attr("r", 20)
            .attr("class", "process-node")
            .call(d3.drag()
                .on("start", dragstartProcess)
                .on("drag", draggedProcess)
                .on("end", dragendProcess));
        
        const nodeText = nodeEnter.append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("pointer-events", "none")
            .text(d => d.id);
        
        node.select("text")
            .text(d => d.id);
        
        nodeText.merge(node.select("text"));
        nodeEnter.merge(node);
        node.exit().remove();
        
        // Restart the simulation
        simulation.nodes(nodes);
        simulation.force("link").links(links);
        simulation.alpha(1).restart();
        }
    //+++++++++++render ends here ++++++++++
        function dragendProcess(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        function dragstartProcess(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function draggedProcess(event, d) {
            const dx = event.x - d.x;
            const dy = event.y - d.y;
                d.fx = d.x + dx;
                d.fy = d.y + dy;
            const group = resourceGroups.get(d);
            group.x += dx;
            group.y += dy;
        }
        // Dragging functions for resource groups
        function dragstartGroup(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d[1][0].x;
            d.fy = d[1][0].y;
        }
        function draggedGroup(event, d) {
            const dx = event.x - d[1][0].x;
            const dy = event.y - d[1][0].y;
            d[1].forEach(node => {
                node.fx = node.x + dx;
                node.fy = node.y + dy;
            });
            const group = resourceGroups.get(d[0]);
            group.x += dx;
            group.y += dy;
        }
        function dragendGroup(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d[1].forEach(node => {
                node.fx = null;
                node.fy = null;
            });
        }
        // Function to handle right-click linking
        function handleContextMenu(event, d) {
            event.preventDefault();
            if (!selectedNode) {
                selectedNode = d;
                d3.selectAll(".node").classed("highlight1", node => node === selectedNode);//iski class ko highlight bna rha hai and css mai highlight class ko green krdiya ja rha hai 
                //
                if(is_delete){//togle on for delete
                    //console.log("selectedNode : " ,selectedNode);
                    //console.log("existing nodes : " , nodes);
                    
                    /*selectedNode :  {id: 'R1.1', type: 'resource', group: 'R1', index: 2, x: 540.3352328537052, …}*/
                    let update_nodes = nodes.filter(node => node.id!=selectedNode.id)

                    nodes.splice(0, nodes.length, ...update_nodes);
                    nodes1.splice(0, nodes1.length, ...update_nodes);
                    let update_links = links.filter(link=>(link.source.id!==selectedNode.id && link.target.id!==selectedNode.id) )
                    links.splice(0, links.length, ...update_links);
                    links1.splice(0, links1.length, ...update_links);
                    selectedNode = null;
                    d3.selectAll(".node").classed("highlight1", false);
                    d3.selectAll(".node").data(nodes, d => d.id).exit().remove();
                    // d3.selectAll(".link").data(links).exit().remove();
                    svg.selectAll(".link").data(links).exit().remove();
                    calc_hold_wait_edges();///re-calculate
                    clac_cycle_edges();///re-calculate
                    renderGraph(); // Ensure this function updates nodes and links in D3
                    return;
                }
                
            }
            else {
                if (selectedNode !== d) {
                    if (
                        (selectedNode.type === "process" && d.type === "resource") ||
                        (selectedNode.type === "resource" && d.type === "process")
                    ) {
                        
                        //edge deletion logic .......
                        //console.log("Trying to delete link:", selectedNode.id, "→", d.id);//working 
                            // Step 1: Find the index of the link to delete
                            const existingEdgeIndex1 = links1.findIndex(link => 
                                link.source === selectedNode.id && link.target === d.id
                            );
                            
                        //console.log(" existingEdgeIndex1:", existingEdgeIndex1);
                        //console.log(' Existing links before deletion:', links1);
                        
                        // Step 2: If the link exists, delete it
                        if (existingEdgeIndex1 !== -1) {
                            //console.log(' Entered deletion process');
                            //console.log(' Existing links before deletion:', links1);
                            // Step 3: Directly remove the link from `links1`
                            links1.splice(existingEdgeIndex1, 1);
                            links.splice(existingEdgeIndex1, 1);
                        
                            //console.log(' After deletion, links:',links );
                            //console.log(' After deletion, links1:',links1 );
                            //console.log(" Exit from deletion segment...");
                            calc_hold_wait_edges()///re-calculate
                            clac_cycle_edges()///re-calculate
                            renderGraph();
                        } 
                        else{
                            if(selectedNode.type === "resource" && d.type === "process"){//check if it is holded by another process 
                                const edge_exits = links1.some(link => link.source===selectedNode.id && link.target!==d.id);
                                if(edge_exits){
                                    let meesage ="INVALID EDGE CREATION ERROR : A single Resource-Instnace can't be assigned to more than 1 Process.";
                                    show_message(meesage)
                                    return ;
                                }
                            }
                            // Check if the edge already exists (in opposite direction)
                            const existingEdgeIndex = links.findIndex(link => 
                                //(link.source.id === selectedNode.id && link.target.id === d.id) ||
                                (link.source.id === d.id && link.target.id === selectedNode.id)
                            );
                            if (existingEdgeIndex !== -1) {
                                // If an existing edge is found, replace it with the new one
                                links[existingEdgeIndex] = { source: selectedNode.id, target: d.id };
                                links1[existingEdgeIndex] = { source: selectedNode.id, target: d.id };
                            } else {
                                // If no existing edge is found, add the new edge
                                links.push({ source: selectedNode.id, target: d.id });
                                links1.push({ source: selectedNode.id, target: d.id });
                            }
                        }
                        //calculate the values each time when a right click appears 
                        //console.log("links : " , links);
                        //console.log("links1: " , links1);
                        //calculation needs when view_event is toggled on 
                        //calculate on each right click 
                        if(isHold==true && isCycle==false){
                            calc_hold_wait_edges();
                            //console.log("check1");
                            
                        }
                        else if(isCycle==true && isHold==false){
                            clac_cycle_edges();
                        }
                        renderGraph();  // Re-render the graph
                    }
                    else {//if user select similar type nodes
                        let message="INVALID EDGE CREATION ERROR : An edge from Process to Process or Reource-Instance to Resource-Instance is not allowed in Resource allocation graph (RAG)."
                        show_message(message);
                    }
                }
                selectedNode = null;
                d3.selectAll(".node").classed("highlight1", false);
            }
        }
        function toggled_Delete(){
                if (is_delete==false){
                    //hide messages and forms
                    hide_addProcess();
                    hide_addResouceInstnace();
                    hide_addResouceInstnace_multiple();
                    hide_message();
                    hide_addProcess();
                    //deactivate view hold-wait
                    if(isHold==true){
                        //hide message
                        const btn = document.getElementById("hold-button");
                        btn.classList.add("blue");
                        btn.classList.remove("hold-button-highlighted");
                        isHold=false;
                        renderGraph();
                    }
                    //deactivate view circular-wait
                    if(isCycle==true){
                        //hide message
                        const btn1 = document.getElementById("circular-button")
                        btn1.classList.add("blue")
                        btn1.classList.remove("circular-button-highlighted")
                        isCycle=false;
                        renderGraph();
                    }
                    
                    is_delete = true;//iske aage kaam rendering kr dega 
                    // let message="IN DELETION MODE: You are currently in Deletion Mode , Right clicking on any Process / Resource Instnace will delete that Process / Resource Instnace. To EXIT this mode just click again Toggle Delete button that is in right bottom corner!!"
                    let message="Activating Deletion mode, Right-click on any Process or Resource-Instance to delete it. To deactivate please click again on Delete button."
                    show_message(message);
                    //
                    const btn = document.getElementById("delete-button");
                    btn.classList.add("delete-button-highlighted");
                    btn.classList.remove("blue");
                    }
                else{
                    is_delete=false;
                    // let message="OUT DELETION MODE: You have Existed the Deletion Mode. Now , You can use the graph simulation smoothly!!"
                    let message="Deactivating Deletion mode. To activate again, click on Delete button."
                    show_message(message);
                    const btn = document.getElementById("delete-button");
                    btn.classList.add("blue");
                    btn.classList.remove("delete-button-highlighted");
                }
            }
        function toggled_reset(x=1){
            hide_addProcess();
            hide_addResouceInstnace();
            hide_addResouceInstnace_multiple();
            hide_addProcess();
            hide_message();
            //deactivate view hold-wait
            if(isHold==true){
                //hide message
                const btn = document.getElementById("hold-button");
                btn.classList.add("blue");
                btn.classList.remove("hold-button-highlighted");
                isHold=false;
                renderGraph();
            }
            //deactivate view circular-wait
            if(isCycle==true){
                //hide message
                const btn1 = document.getElementById("circular-button")
                btn1.classList.add("blue")
                btn1.classList.remove("circular-button-highlighted")
                isCycle=false;
                renderGraph();
            }
            //deactivate deletion mode
            if(is_delete==true){
                const btn = document.getElementById("delete-button");
                btn.classList.add("blue");
                btn.classList.remove("delete-button-highlighted");
                is_delete=false;
                renderGraph();
            }
            //reset all views
            isHold = false;
            isCycle = false;
            is_delete = false;

            //////////////////////////////////if reset clicked for EMPTY GRAPH 
            // console.log(nodes1.length)

            if(nodes1.length ==0 ){
                let message="No existing graph."
                if(x==1){
                show_message(message);
                }
            }
            else{
                let message="Graph is being reset to empty graph"
                if(x==1){
                show_message(message);
                }
            }
            //////////////////////////////////////

            //delete all nodes and links
            //console.log(nodes1.length)
            nodes.splice(0,nodes.length)
            nodes1.splice(0,nodes1.length);
            links.splice(0,links.length)
            links1.splice(0,links1.length)
            //console.log(nodes1.length)
            renderGraph();
            //show message
            
            // console.log(nodes1.length)

            
        }
        function show_message(message=""){
            const div=document.getElementById("alert_message_box");
            let paragraph=document.getElementById("message_para")
            paragraph.textContent="";//make the existing text out
            paragraph.textContent +=message;

            div.classList.remove("input");
            div.classList.add("input_visible");
            div.classList.add("justified")
        }
        function hide_message(){
            const div=document.getElementById("alert_message_box");
            let paragraph=document.getElementById("message_para")
            paragraph.textContent ="";
            div.classList.remove("input_visible");
            div.classList.add("input");
        }
        function edge_creation(){
            hide_addProcess();
            hide_addResouceInstnace();
            hide_addResouceInstnace_multiple();
            hide_message();
            //deactivate view hold-wait
            if(isHold==true){
                //hide message
                const btn = document.getElementById("hold-button");
                btn.classList.add("blue");
                btn.classList.remove("hold-button-highlighted");
                isHold=false;
                renderGraph();
            }
            //deactivate view circular-wait
            if(isCycle==true){
                //hide message
                const btn1 = document.getElementById("circular-button")
                btn1.classList.add("blue")
                btn1.classList.remove("circular-button-highlighted")
                isCycle=false;
                renderGraph();
            }
            //deactivate deletion mode
            if(is_delete==true){
                const btn = document.getElementById("delete-button");
                btn.classList.add("blue");
                btn.classList.remove("delete-button-highlighted");
                is_delete=false;
                renderGraph();
            }
            // let message="Assignment Edge Creation: (Resource-Instnace -> Process, blue color) First right click on any Resource-Instance and then right click on any Process. Requesting Edge Creation: (Process -> Resource-Instnace, red color) First right click on any Process and then right click on any Resource-Istance."
            let message="Assignment Edge Creation: Right-click (or long-press) on a resource instance, followed by a right-click (or long-press) on a process to generate an assignment edge represented by blue color in the graph simulation, or right-click (or long-press) on a process, followed by a right-click (or long-press) on a resource instance to generate a requesting edge represented by red color in the simulation."
            show_message(message)
        }
        function edge_deletion(){
            hide_addProcess();
            hide_addResouceInstnace();
            hide_addResouceInstnace_multiple();
            hide_message();
            //deactivate view hold-wait
            if(isHold==true){
                //hide message
                const btn = document.getElementById("hold-button");
                btn.classList.add("blue");
                btn.classList.remove("hold-button-highlighted");
                isHold=false;
                renderGraph();
            }
            //deactivate view circular-wait
            if(isCycle==true){
                //hide message
                const btn1 = document.getElementById("circular-button")
                btn1.classList.add("blue")
                btn1.classList.remove("circular-button-highlighted")
                isCycle=false;
                renderGraph();
            }
            //deactivate deletion mode
            if(is_delete==true){
                const btn = document.getElementById("delete-button");
                btn.classList.add("blue");
                btn.classList.remove("delete-button-highlighted");
                is_delete=false;
                renderGraph();
            }
            // let message = "Assignment/Requesting Edge deletion: whether it is Assignment or requesting edge, to delete it right click on its tail Process/Resource-Instance and then right-click on its head Process/Resource-Instance."
            let message = "Assignment/Requesting Edge deletion: To delete an edge (either assignment or requesting), right-click (or long-press) on its tail process/resource instance and then right-click (or long-press) on its head process/resource instance";
            show_message(message)
        }
        function visible_Process(){
            hide_addResouceInstnace();
            hide_addResouceInstnace_multiple();
            hide_message();//hides all messages
            //deactivate view hold-wait
            if(isHold==true){
                //hide message
                const btn = document.getElementById("hold-button");
                btn.classList.add("blue");
                btn.classList.remove("hold-button-highlighted");
                isHold=false;
                renderGraph();
            }
            //deactivate view circular-wait
            if(isCycle==true){
                //hide message
                const btn1 = document.getElementById("circular-button")
                btn1.classList.add("blue")
                btn1.classList.remove("circular-button-highlighted")
                isCycle=false;
                renderGraph();
            }
            //deactivate deletion mode
            if(is_delete==true){
                const btn = document.getElementById("delete-button");
                btn.classList.add("blue");
                btn.classList.remove("delete-button-highlighted");
                is_delete=false;
                renderGraph();
            }
            //make the form visible to "Add processes"
            const div = document.getElementById("input_process");
            //console.log(div.className);
            div.classList.remove("input")
            div.classList.add("input_visible"); // Replaces all existing classes
            const form = document.getElementById("process-form");
            // Reset the form to its default state
            form.reset();
        }
        function hide_addProcess(){
            //hide the form of "Add processes"
            const div = document.getElementById("input_process");
            div.classList.remove("input_visible")
            div.classList.add("input");
            
        }
        ///FORMS RELATED SETTINGS /////
        // This function handles the form submission for "Add Process functionality"
        function setupForm() {
            const form = document.getElementById("process-form");
            //define what Cancel does
            const cancelButton=document.getElementById("cancel-button");
            cancelButton.addEventListener("click", () => {
                form.reset(); //reset the form 
                hide_addProcess();//hide the form if needed
            });

            form.addEventListener("submit", function (e) {
            e.preventDefault();
            const value = Number(document.getElementById("input-for-process").value);
            if (isNaN(value) || value <= 0) {
                let message="Please Enter a Valid Number that is greater than 1";//althouh this is replaced by requird in form html
                show_message(message);                
                return;
            }
            addNode(value);
            });
        }
        function visible_ResourceInstance(){//the similar is written as if it was called on class it will have displayed both forms of addd Proceess and of add resource instance 
            hide_addProcess();
            hide_addResouceInstnace_multiple();
            hide_message();//hides all messages
            //deactivate view hold-wait
            if(isHold==true){
                //hide message
                const btn = document.getElementById("hold-button");
                btn.classList.add("blue");
                btn.classList.remove("hold-button-highlighted");
                isHold=false;
                renderGraph();
            }
            //deactivate view circular-wait
            if(isCycle==true){
                //hide message
                const btn1 = document.getElementById("circular-button")
                btn1.classList.add("blue")
                btn1.classList.remove("circular-button-highlighted")
                isCycle=false;
                renderGraph();
            }
            //deactivate deletion mode
            if(is_delete==true){
                const btn = document.getElementById("delete-button");
                btn.classList.add("blue");
                btn.classList.remove("delete-button-highlighted");
                is_delete=false;
                renderGraph();
            }
            //make the form visible to "Add Resource Instance"
            const div = document.getElementById("input_resource_instance");
            div.classList.remove("input")
            div.classList.add("input_visible"); // Replaces all existing classes
            const form = document.getElementById("resource-form");
            // Reset the form to its default state
            form.reset();
        }
        function hide_addResouceInstnace(){
            //hide the form of "Add processes"
            const div = document.getElementById("input_resource_instance");
            div.classList.remove("input_visible")
            div.classList.add("input");
            
        }
        // This function handles the form submission for "Add Resource Instance functionality"
        function setupFormResource() {
            const form = document.getElementById("resource-form");
            //define what Cancel does
            const cancelButton=document.getElementById("cancel-button-resorce");
            cancelButton.addEventListener("click", () => {
                form.reset(); //reset the form 
                hide_addResouceInstnace();//hide the form if needed
            });

            form.addEventListener("submit", function (e) {
            e.preventDefault();
            const value = Number(document.getElementById("input-for-resource").value);
            if (isNaN(value) || value <= 0) {
                let message="Please Enter a Valid Number that is greater than 1";//althouh this is replaced by requird in form html
                show_message(message); 
                return;
            }
            addResourceInstance(value)
            hide_addResouceInstnace();
            });
        }
        //for "ADD RESOURCES"
        function visible_ResourceInstance_multiple(){//the similar is written as if it was called on class it will have displayed both forms of addd Proceess and of add resource instance 
            hide_addProcess();
            hide_addResouceInstnace_multiple();
            hide_message();//hides all messages
            //deactivate view hold-wait
            if(isHold==true){
                //hide message
                const btn = document.getElementById("hold-button");
                btn.classList.add("blue");
                btn.classList.remove("hold-button-highlighted");
                isHold=false;
                renderGraph();
            }
            //deactivate view circular-wait
            if(isCycle==true){
                //hide message
                const btn1 = document.getElementById("circular-button")
                btn1.classList.add("blue")
                btn1.classList.remove("circular-button-highlighted")
                isCycle=false;
                renderGraph();
            }
            //deactivate deletion mode
            if(is_delete==true){
                const btn = document.getElementById("delete-button");
                btn.classList.add("blue");
                btn.classList.remove("delete-button-highlighted");
                is_delete=false;
                renderGraph();
            }
            //make the form visible to "Add Resource Multile"
            const div = document.getElementById("input_resource_instance_multiple");
            div.classList.remove("input")
            div.classList.add("input_visible"); // Replaces all existing classes
            const form = document.getElementById("resource-form-multiple");
            // Reset the form to its default state
            form.reset();
        }
        function hide_addResouceInstnace_multiple(){
            //hide the form of "Add processes"
            const div = document.getElementById("input_resource_instance_multiple");
            div.classList.remove("input_visible")
            div.classList.add("input");
            
        }
        // This function handles the form submission for "Add Resource functionality"
        function setupFormResource_multiple() {
            const form = document.getElementById("resource-form-multiple");
            //define what Cancel does
            const cancelButton=document.getElementById("cancel-button-resorce-multiple");
            cancelButton.addEventListener("click", () => {
                form.reset(); //reset the form 
                hide_addResouceInstnace_multiple();//hide the form if needed
            });

            form.addEventListener("submit", function (e) {
            e.preventDefault();
            const value = Number(document.getElementById("input-for-resource-multiple").value);
            if (isNaN(value) || value <= 0) {
                let message="Please Enter a Valid Number that is greater than 1";//althouh this is replaced by requird in form html
                show_message(message); 
                return;
            }
            const value1 = Number(document.getElementById("input-for-resource-multiple1").value);
            if (isNaN(value1) || value1 <= 0) {
                let message="Please Enter a Valid Number that is greater than 1";//althouh this is replaced by requird in form html
                show_message(message);                 
                return;
            }
            addMultipleResources(value,value1)
            hide_addResouceInstnace_multiple();
            });
        }
        ///FORMS RELATED SETTINGS ENDS HERE/////
        // Function to add a new process node
        function addNode(value) {
            const numberOfNodes = value;
            // Check if the input is a valid number
            if (isNaN(numberOfNodes) || numberOfNodes <= 0) {
                let message="Please Enter a Valid Number that is greater than 1";//althouh this is replaced by requird in form html
                show_message(message); 
                return;
            }
            
            for (let i = 0; i < numberOfNodes; i++) {
                const newNodeId = `P${nodes.filter((node) => node.type === "process").length + 1}`;
                const newNode = {
                    id: newNodeId,
                    type: "process",
                    x: width / 2,
                    y: height / 2,};
                nodes.push(newNode);
                nodes1.push(newNode);
            }
            //console.log("nodes : ", nodes);
            //console.log("nodes1: ", nodes1);
            hide_addProcess()            //hide the form 
            renderGraph(); // Call renderGraph() once after adding all nodes
        }
            function addMultipleResources(value,value1) {
                let m = value;
                let n = value1
                // Validate inputs: Must be natural numbers (positive integers)
                if (isNaN(m) || isNaN(n) || m < 1 || n < 1 || !Number.isInteger(m) || !Number.isInteger(n)) {
                    let message="Please Enter a Valid Number that is greater than 1";//althouh this is replaced by requird in form html
                    show_message(message); 
                    return;
                }
                // Find the highest existing resource number
                const resourceNumbers = nodes
                    .filter(node => node.type === 'resource')
                    .map(node => parseInt(node.id.split('.')[0].substring(1)))
                    .filter(num => !isNaN(num));
                let startingResourceNumber = (resourceNumbers.length > 0 ? Math.max(...resourceNumbers) : 0) + 1;
                // Create m resources, each with n instances
                for (let i = 0; i < m; i++) {
                    let resourceNumber = startingResourceNumber + i;
                    for (let j = 1; j <= n; j++) {
                        const newResourceId = `R${resourceNumber}.${j}`;
                        const newResource = { id: newResourceId, type: 'resource', group: `R${resourceNumber}` };
                        nodes.push(newResource);
                        nodes1.push(newResource);
                    }
                }
                //console.log("nodes:", nodes);
                //console.log("nodes1:", nodes1);
                renderGraph();
            }
        // Function to add a new resource instance
        function addResourceInstance(value) {
            const resourceNumber =value;
            if (resourceNumber) {
                const existingResources = nodes.filter(node => 
                    node.type === 'resource' && node.id.startsWith(`R${resourceNumber}.`)
                );
                if (existingResources.length > 0) {
                    let maxNumber = 0;
                    nodes1.forEach(node => {
                        if (node.type === "resource" && node.id.startsWith(`R${resourceNumber}.`)) {
                            let match = node.id.match(/R\d+\.(\d+)$/); // Extract only the last numeric part
                            if (match) {
                                let num = parseInt(match[1]); // Convert to number
                                maxNumber = Math.max(maxNumber, num);
                            }
                        }
                    });
                    const newInstanceNumber = maxNumber + 1;            
                    const newResourceId = `R${resourceNumber}.${newInstanceNumber}`;
                    const newResource = { id: newResourceId, type: 'resource', group: `R${resourceNumber}` };
                    nodes.push(newResource);
                    nodes1.push(newResource);
                    //console.log("nodes : " , nodes);
                    //console.log("nodes1: " , nodes1);
                } else {
                    const newResourceId = `R${resourceNumber}.1`;
                    const newResource = { id: newResourceId, type: 'resource', group: `R${resourceNumber}` };
                    nodes.push(newResource);
                    nodes1.push(newResource);
                    //console.log("nodes : " , nodes);
                    //console.log("nodes1: " , nodes1);
                }
                renderGraph();
            }
        }
        //hold wait functionality  
        function show_links_hold_wait(){
            if(isHold==false){
                hide_addProcess();
                hide_addResouceInstnace();
                hide_addResouceInstnace_multiple();
                hide_message();
                //deactivate view circular-wait
                if(isCycle==true){
                    //hide message
                    const btn1 = document.getElementById("circular-button")
                    btn1.classList.add("blue")
                    btn1.classList.remove("circular-button-highlighted")
                    isCycle=false;
                    renderGraph();
                }
                //deactivate deletion mode
                if(is_delete==true){
                    const btn = document.getElementById("delete-button");
                    btn.classList.add("blue");
                    btn.classList.remove("delete-button-highlighted");
                    is_delete=false;
                    renderGraph();
                }
                isHold = true;//iske aage kaam rendering kr dega 
                //make the circular button normal
                isCycle=false;
                const btn1 = document.getElementById("circular-button")
                btn1.classList.add("blue")
                btn1.classList.remove("circular-button-highlighted")
                calc_hold_wait_edges()
                let message ="Activating HOLD-WAIT View : Edges in Hold-wait condition will now highlighted with yellow. To deactivate click again on View Hold-Wait button."

                // the graph simulation will now highlight the edges in yellow if they found in hold-wait condition. To deactivate this, please click again on 'View Hold & wait' button."
                show_message(message); 
                ///
                const btn = document.getElementById("hold-button")
                btn.classList.add("hold-button-highlighted")
                btn.classList.remove("blue")
            }
            else{
                isHold=false;//iske aage kaam rendering kr dega
                // let message="OUT of HOLD-WAIT VIEW : You have been out of Hold-Wait View , Now the edges in Hold-Wait condition will not be highlighted.!!";
                let message="Deactivating HOLD-WAIT view. To activate again, click on View Hold-Wait button"
                show_message(message); 
                ////
                const btn = document.getElementById("hold-button")
                btn.classList.add("blue")
                btn.classList.remove("hold-button-highlighted")
            }
            //console.log("isHold : " , isHold)
            renderGraph();//re-render for applying the view
        }
        function show_links_circular_wait(){           
            if(isCycle==false){
                hide_addProcess();
                hide_addResouceInstnace();
                hide_addResouceInstnace_multiple();
                hide_message();
                //deactivate view hold-wait
                if(isHold==true){
                    //hide message
                    const btn = document.getElementById("hold-button");
                    btn.classList.add("blue");
                    btn.classList.remove("hold-button-highlighted");
                    isHold=false;
                    renderGraph();
                }
                //deactivate deletion mode
                if(is_delete==true){
                    const btn = document.getElementById("delete-button");
                    btn.classList.add("blue");
                    btn.classList.remove("delete-button-highlighted");
                    is_delete=false;
                    renderGraph();
                }
                isCycle = true;//iske aage kaam rendering kr dega 
                isHold=false;
                ////
                clac_cycle_edges()
                // let message="IN CIRCULAR-WAIT VIEW: You have activated Circular-Wait View that means you can run the Graph Simulation smoothly. But the the Graph will now check each Edge for Circular-Wait Condition if the edge in Circular-wait condition (or comes in Circular-wait condition in future) it will be highlighted with GREEN!!. Circular-Wait condition comes into view when a Process P1 is waiting for a resource held by P2, P2 is waiting for a resource held by P3, ... and finally, Pn is waiting for a resource held by P1 at a same Time. This forms a cycle in the RAG. To exit this view, again click on View Circular-Wait Button.";
                let message="Activating CIRCULAR-WAIT VIEW : Edges in circular-wait condition will now highlighted with green. To deactivate click again on View Circular-Wait button." 
                //the graph simulation will now highlight the edges in Green, if they found in circular-wait condition. To deactivate this, please click again on 'View Circular wait' button."
                show_message(message); 
                ///
                const btn1 = document.getElementById("circular-button")
                btn1.classList.add("circular-button-highlighted")
                btn1.classList.remove("blue")
            }
            else{
                isCycle=false;//iske aage kaam rendering kr dega 
                // let message="OUT of CIRCULAR-WAIT VIEW : You have been out of Circular-Wait View , Now the edges in Circular-Wait condition will not be highlighted.!!";
                let message="Deactivating Circular-WAIT view. To activate again, click on View Circular-Wait button"
                show_message(message);
                ///
                const btn1 = document.getElementById("circular-button")
                btn1.classList.add("blue")
                btn1.classList.remove("circular-button-highlighted")
            }
            //console.log("iscYCLE : " , isCycle)
            renderGraph();//re-render for applying the view
        }
        // Ensure nodes stay within the boundaries
        function applyBoundaryConstraints() {
            const margin = groupSize / 2;
            nodes.forEach(d => {
                const radius = d.type === 'process' ? 20 : 40;
                d.x = Math.max(margin, Math.min(width - margin, d.x));
                d.y = Math.max(margin, Math.min(height - margin, d.y));
            });

            resourceGroups.forEach((group) => {
                group.x = Math.max(margin, Math.min(width - margin, group.x));
                group.y = Math.max(margin, Math.min(height - margin, group.y));
            });
        }
        

/*********************************************************************************** */
/////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector(".header");
  // This event listener checks if the user has scrolled more than 10px
  // If yes, it adds the 'scrolled' class to the header (for styling changes like shrinking)
  // If not, it removes the 'scrolled' class
  window.addEventListener("scroll", function () {
    if (window.scrollY > 10) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // sticky nav 
  const navWrapper = document.getElementById("navWrapper");
  const trigger = document.querySelector(".sticky-trigger");

  const observer = new IntersectionObserver(
      (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        navWrapper.classList.add("sticky-nav-wrapper");
      } else {
        navWrapper.classList.remove("sticky-nav-wrapper");
      }
    });
  },
  {
    rootMargin: "-60px 0px 0px 0px", // triggers earlier, avoids flicker
    threshold: 0
  }
  );

  observer.observe(trigger);

  // back to top logic
  const backToTopBtn = document.getElementById("backToTop");

  window.onscroll = function() {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      backToTopBtn.style.display = "block";
    } else {
      backToTopBtn.style.display = "none";
    }
  };

  backToTopBtn.onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startQuizBtn = document.getElementById("start-quiz-btn");
  if (startQuizBtn) {
    startQuizBtn.addEventListener("click", () => {
      document.getElementById("quiz-instructions").style.display = "none";
      document.getElementById("quiz-content").style.display = "block";
      showQuestion();
    });
  } else {
    console.error("start-quiz-btn element not found");
  }
});
////////////////////////////////////////////////////

// Object to store references to different topic sections by their IDs
let topicElements = {
  aim: document.getElementById("aim"),
  theory: document.getElementById("theory"),
  procedure: document.getElementById("procedure"),
  practice: document.getElementById("practice"),
  code: document.getElementById("code"),
  result: document.getElementById("result"),
  quiz: document.getElementById("quiz"),
  references: document.getElementById("references"),
  tnt: document.getElementById("tnt"),
};

let currentTopic = "aim"; // Track the currently displayed topic
function switchContent(topic) {
    if (topic === currentTopic) {
        return; // Prevent unnecessary updates if the same topic is clicked again
    }

    topicElements[currentTopic].style.display = 'none'; // Hide the previous topic
    topicElements[topic].style.display = 'block'; // Show the selected topic
    currentTopic = topic; // Update the current topic
}

// Generalized function to toggle language-based code blocks
function toggleCode(language) {
  const allCodeBlocks = document.querySelectorAll(".code-block");
  allCodeBlocks.forEach((block) => block.classList.remove("active"));

  const selectedCodeBlock = document.getElementById(language + "Code");
  selectedCodeBlock.classList.add("active");
}

// Clipboard copy function
function copyCode(elementId) {
  const codeBlock = document.getElementById(elementId);
  const code = codeBlock.querySelector("code").innerText;

  // Copy the selected code text to clipboard
  navigator.clipboard
    .writeText(code)
    .then(() => {
      const copyButton = codeBlock.querySelector(".copy-button");
      copyButton.textContent = "Copied!"; // Temporarily change button text
      setTimeout(() => {
        copyButton.textContent = "Copy"; // Reset text after 2 seconds
      }, 2000);
    })
    .catch((err) => {
      console.error("Could not copy text: ", err);
    });
}

// Event listeners for radio buttons
const cppRadio = document.getElementById("cppRadio");
if (cppRadio) {
  cppRadio.addEventListener("change", () => toggleCode("cpp"));
}
const pythonRadio = document.getElementById("pythonRadio");
if (pythonRadio) {
  pythonRadio.addEventListener("change", () => toggleCode("python"));
}

// Event listener for copy buttons
document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", function () {
    const language = button.closest(".code-block").id.replace("Code", "");
    copyCode(language + "Code");
  });
});

// Quiz Logic
const questions = [
  {
    question: " Q1) Which of the following is not one of the four necessary conditions for a deadlock to occur?",
    choices: ["Mutual Exclusion", "Circular Wait", "Recursive Check", "Hold and wait"],
    correctAnswers: [2], 
  },
  {
    question: " Q2) Which of the following are true for a RAG?",
    choices: ["Resources can only have 1 instance", "It is used for System Resouce managmenet", "It is used to find deadlocks", "RAG stands for Resource Augmented Graph"],
    correctAnswers: [1,2], 
  },
  {
    question: "Q3) <b>Statement:</b> Deadlock can be present in a RAG if we find a cycle and each resource has single isntance <p><b>Reason:</b> in case of single instance since they can be held by only one process, the requesting process cannot get the resource until it's free.</p>",
    choices: ["Statement is true, Reason is false", "Statement is false, Reason is true", "Both statement and reason are false", "Both statement and reason true"],
    correctAnswers: [3], 
  },
  {
    question: "Q4) What does the presence of 'No-Preemption' mean?",
    choices: ["Resources can be taken back by the system", "A process gives up resources only when finished", "Resources cannot be taken away from a process", "Conditions give no info about deadlock"],
    correctAnswers: [2], 
  },
];

let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];

const questionElement = document.getElementById("question");
const choicesContainer = document.getElementById("choices");
const nextButton = document.getElementById("next-btn");
const retakeButton = document.getElementById("retake-btn");
const quizReport = document.getElementById("quiz-report");

function showQuestion() {
  // console.log("showQuestion called, currentQuestionIndex:", currentQuestionIndex);
  let currentQuestion = questions[currentQuestionIndex];
  questionElement.innerHTML = currentQuestion.question;
  choicesContainer.innerHTML = "";
  userAnswers[currentQuestionIndex] = [];

  currentQuestion.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.textContent = choice;
    button.classList.add("choice");
    button.addEventListener("click", () => toggleSelection(index));
    choicesContainer.appendChild(button);
  });

  nextButton.disabled = true; // Disable Next until an answer is selected
  nextButton.style.display = "block";
  retakeButton.style.display = "none";
}

function toggleSelection(selectedIndex) {
  // console.log("toggleSelection called, selectedIndex:", selectedIndex);
  if (!userAnswers[currentQuestionIndex]) {
    userAnswers[currentQuestionIndex] = [];
  }
  const selected = userAnswers[currentQuestionIndex];
  const idx = selected.indexOf(selectedIndex);

  if (idx > -1) {
    selected.splice(idx, 1);
  } else {
    selected.push(selectedIndex);
  }

  // Update button styles
  document.querySelectorAll(".choice").forEach((btn, index) => {
    if (selected.includes(index)) {
      btn.style.backgroundColor = "#4285F4";
      btn.style.color = "white";
    } else {
      btn.style.backgroundColor = "#f1f1f1";
      btn.style.color = "black";
    }
  });

  nextButton.disabled = selected.length === 0;
}

function checkAnswer() {
  // console.log("checkAnswer called, currentQuestionIndex:", currentQuestionIndex, "userAnswer:", userAnswers[currentQuestionIndex]);
  const correctAnswers = questions[currentQuestionIndex].correctAnswers;
  const userAnswer = userAnswers[currentQuestionIndex];

  if (arraysEqual(correctAnswers, userAnswer)) {
    score++;
  }

  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    showQuestion();
  } else {
    showResults();
  }
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((val) => b.includes(val));
}

function showResults() {
  questionElement.textContent = `Quiz Completed! Your Score: ${score} / ${questions.length}`;
  choicesContainer.innerHTML = "";
  nextButton.style.display = "none";
  retakeButton.style.display = "block";
  displayQuizReport();
}

function displayQuizReport() {
  quizReport.style.display = "block";
  quizReport.innerHTML = "<h3>Quiz Report</h3>";

  questions.forEach((q, index) => {
    const userAnswer = userAnswers[index] || [];
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("quiz-report-question");

    const questionText = document.createElement("p");
    questionText.innerHTML = q.question;
    questionDiv.appendChild(questionText);

    const choicesList = document.createElement("ul");
    q.choices.forEach((choice, i) => {
      const choiceItem = document.createElement("li");
      const isSelected = userAnswer.includes(i);
      const isCorrect = q.correctAnswers.includes(i);
      if(!isSelected){
        choiceItem.style.color = isCorrect ? "orange" : "black";
      }
      if (isSelected) {
        choiceItem.style.color = isCorrect ? "green" : "red";
      }
      choiceItem.textContent = choice;
      choicesList.appendChild(choiceItem);
    });

    questionDiv.appendChild(choicesList);
    quizReport.appendChild(questionDiv);
  });
}

retakeButton.addEventListener("click", () => {
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];
  quizReport.style.display = "none";
  showQuestion();
});

nextButton.addEventListener("click", checkAnswer);

showQuestion();

        //INITIALISATION
// Sample data for Resource Allocation Graph
        const nodes = [
            { id: 'P1', type: 'process' },
            { id: 'P2', type: 'process' },
            { id: 'R1.1', type: 'resource', group: 'R1' },
            { id: 'R1.2', type: 'resource', group: 'R1' },
            { id: 'R2.1', type: 'resource', group: 'R2' }
        ];
        const links = [
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];
        const nodes1 = [
            { id: 'P1', type: 'process' },
            { id: 'P2', type: 'process' },
            { id: 'R1.1', type: 'resource', group: 'R1' },
            { id: 'R1.2', type: 'resource', group: 'R1' },
            { id: 'R2.1', type: 'resource', group: 'R2' }
        ];
        const links1 = [//since d3 is upadating link array rapidly we can't use that for mathematical logics there we define this array 
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];
        let yellowLinks=[
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];//global variable to store the yellow links
        let cycleLinks=[
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];//global variable to store the cycle links
        let local_iteration_cycle_links=[
            { source: 'P1', target: 'R1.1' },
            { source: 'R1.2', target: 'P2' },
            { source: 'P2', target: 'R2.1' }
        ];

        //toggling features 
        let isHold = false;
        let isCycle = false;
        let is_delete = false;

        //Assign widht and height based on device size (i.e responsivenness)
        // canvas for the render
        const width = 0.80*window.innerWidth
        const height = 600;
        
        // console.log("Please : width",width," height ", height );
        const svg = d3.select("#rag-container")
            .append("svg")
            .attr("width", width)//100% means take full size of parent
            .attr("height", height);
        // Add a visible boundary
        svg.append("rect")
            .attr("class", "boundary")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height);

        let selectedNode = null; // Track the selected node for linking
        const groupSize = 120; // Size of the resource group box

        let number_of_resource_instance=0;
        for (let node of nodes) {
            if (node.type==='resource'){
                number_of_resource_instance ++;
            }
        }
        // //console.log(number_of_resource_instance)
        const resourceGroups = new Map(); // Store group center positions
        // Create a force simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.type === 'process' ? 40 : 60))
            .force("groupContainment", forceGroupContainment)
        // Add arrow markers for directional links
        svg.append("defs").html(`
        <marker id="arrow-red" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF0000"></path>
        </marker>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="blue"></path>
        </marker>
        
        </marker>
        `);

        //just initializes the form for each run of dom (This is important)
        window.addEventListener("DOMContentLoaded", setupForm);
        window.addEventListener("DOMContentLoaded", setupFormResource);
        window.addEventListener("DOMContentLoaded", setupFormResource_multiple);
        // hide_forms();
        // Initial rendering of the graph
        yellowLinks=[];//just making the yelloLinks empty in start //dont delete this
        cycleLinks=[];//just making the cycleLinks empty in start //dont delete this
        local_iteration_cycle_links=[];
        toggled_reset(0);// making the first initialised empty
        renderGraph();
        // Update positions of links and nodes after every tick of the simulation
        simulation.on("tick", () => {
            applyBoundaryConstraints();
            // Update resource group positions based on their nodes
            resourceGroups.forEach((group, groupId) => {
                const groupNodes = nodes.filter(n => n.type === 'resource' && n.group === groupId);
                if (groupNodes.length > 0) {
                    group.x = d3.mean(groupNodes, d => d.x);
                    group.y = d3.mean(groupNodes, d => d.y);
                }
            });

            // Apply group containment force
            forceGroupContainment(simulation.alpha());

            // Update link positions
            svg.selectAll(".link")
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            // Update node positions
            svg.selectAll(".node")
                .attr("transform", d => `translate(${d.x},${d.y})`);

            // Update resource group positions
            svg.selectAll(".resource-group")
                .attr("transform", d => {
                    const group = resourceGroups.get(d[0]);
                    return `translate(${group.x},${group.y})`;
                });
        });
        
