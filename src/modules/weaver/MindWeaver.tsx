// @ts-nocheck
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
// @ts-ignore
import type { Note } from '../../types';

interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    title: string;
    group: number;
    radius: number;
    tags: string[];
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
    value: number;
}

const MindWeaver: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { notes, settings } = useStore();
    const navigate = useNavigate();
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Extract all unique tags
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        notes.forEach(note => note.tags.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [notes]);

    // Prepare Graph Data
    const data = useMemo(() => {
        // Filter nodes based on search and tags
        const filteredNotes = notes.filter(note => {
            const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTags = selectedTags.length === 0 || selectedTags.some(t => note.tags.includes(t));
            return matchesSearch && matchesTags;
        });

        const nodes: GraphNode[] = filteredNotes.map(note => ({
            id: note.id,
            title: note.content.split('\n')[0] || 'Untitled',
            group: 1,
            radius: 6 + Math.sqrt(note.content.length) / 4,
            tags: note.tags,
        }));

        const links: GraphLink[] = [];
        const linkSet = new Set<string>();
        const nodeIds = new Set(nodes.map(n => n.id)); // Optimization: only link if both nodes exist

        for (let i = 0; i < filteredNotes.length; i++) {
            for (let j = i + 1; j < filteredNotes.length; j++) {
                const n1 = filteredNotes[i];
                const n2 = filteredNotes[j];

                // Find common tags
                const commonTags = n1.tags.filter(tag => n2.tags.includes(tag));

                if (commonTags.length > 0) {
                    const id = [n1.id, n2.id].sort().join('-');
                    if (!linkSet.has(id)) {
                        linkSet.add(id);
                        links.push({
                            source: n1.id,
                            target: n2.id,
                            value: 1 + Math.sqrt(commonTags.length), // Thickness
                        });
                    }
                }
            }
        }

        return { nodes, links };
    }, [notes, searchQuery, selectedTags]);

    // D3 Simulation
    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.nodes.length === 0) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Clear previous
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height);

        // Definitions for Gradients & Filters
        const defs = svg.append("defs");

        // Glass Gradient
        const gradient = defs.append("radialGradient")
            .attr("id", "glassGradient")
            .attr("cx", "30%")
            .attr("cy", "30%")
            .attr("r", "70%");

        gradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(255, 255, 255, 0.8)");
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(255, 255, 255, 0.1)");

        // Amber Glow Filter
        const filter = defs.append("filter")
            .attr("id", "glow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");

        filter.append("feGaussianBlur")
            .attr("stdDeviation", "2.5")
            .attr("result", "coloredBlur");

        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        const g = svg.append("g");

        // Zoom
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Simulation
        const simulation = d3.forceSimulation<GraphNode>(data.nodes)
            .force("link", d3.forceLink<GraphNode, GraphLink>(data.links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(d => (d as GraphNode).radius + 8));

        // Load saved positions
        const savedPositions = JSON.parse(localStorage.getItem('eunoia_weaver_positions') || '{}');
        data.nodes.forEach(n => {
            if (savedPositions[n.id]) {
                n.x = savedPositions[n.id].x;
                n.y = savedPositions[n.id].y;
            }
        });

        // Links (Amber Glow)
        const link = g.append("g")
            .selectAll<SVGLineElement, GraphLink>("line")
            .data(data.links)
            .join("line")
            .attr("stroke", settings.theme === 'dark' ? "#f59e0b" : "#d97706") // Amber-500/600
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", d => Math.sqrt(d.value))
            .attr("filter", "url(#glow)"); // Add glow to links too? Maybe too much. Let's try.

        // Nodes (Glass Orbs)
        const nodeGroup = g.append("g")
            .selectAll<SVGGElement, GraphNode>("g")
            .data(data.nodes)
            .join("g")
            .call(d3.drag<SVGGElement, GraphNode>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Node Circle (Backdrop for color)
        nodeGroup.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", settings.theme === 'dark' ? "rgba(245, 158, 11, 0.4)" : "rgba(217, 119, 6, 0.4)") // Amber transparent
            .attr("filter", "url(#glow)");

        // Node Circle (Glass Overlay)
        nodeGroup.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", "url(#glassGradient)")
            .attr("stroke", settings.theme === 'dark' ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.1)")
            .attr("stroke-width", 1);

        // Node Border Ring (Selection/Activity)
        nodeGroup.append("circle")
            .attr("r", d => d.radius + 3)
            .attr("fill", "none")
            .attr("stroke", settings.theme === 'dark' ? "#fcd34d" : "#b45309")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 1);


        // Interaction (Hover)
        nodeGroup.on("click", (event, d) => {
            navigate(`/editor/${d.id}`);
        });

        nodeGroup.on("mouseenter", function (event, d) {
            setHoveredNode(d);
            d3.select(this).selectAll("circle")
                .transition().duration(300)
                .attr("transform", "scale(1.2)");

            // Bring to front
            d3.select(this).raise();
        });

        nodeGroup.on("mouseleave", function (event, d) {
            setHoveredNode(null);
            d3.select(this).selectAll("circle")
                .transition().duration(300)
                .attr("transform", "scale(1)");
        });

        // Drag functions
        function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
            d.fx = event.x;
            d.fy = event.y;
        }

        simulation.on("tick", () => {
            // Save positions periodically (basic implementation, running every tick is too heavy, stick to dragEnd or unmount)
            // Instead of every tick, let's save on dragEnd for manual moves, and maybe once settling?
            // Actually, simplest is to save on unmount or dragEnd.

            link
                .attr("x1", d => (d.source as GraphNode).x!)
                .attr("y1", d => (d.source as GraphNode).y!)
                .attr("x2", d => (d.target as GraphNode).x!)
                .attr("y2", d => (d.target as GraphNode).y!);

            // Update Group Transform
            nodeGroup
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Save positions on drag end
        function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;

            // Save all positions
            const positions = data.nodes.reduce((acc, n) => ({
                ...acc,
                [n.id]: { x: n.x, y: n.y }
            }), {});
            localStorage.setItem('eunoia_weaver_positions', JSON.stringify(positions));
        }

        // Cleanup
        return () => {
            // Save on unmount to capture simulation settling
            const positions = data.nodes.reduce((acc, n) => ({
                ...acc,
                [n.id]: { x: n.x, y: n.y }
            }), {});
            localStorage.setItem('eunoia_weaver_positions', JSON.stringify(positions));
            simulation.stop();
        };
    }, [data, settings.theme, navigate]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-stone-50 dark:bg-stone-900 transition-colors">
            <svg ref={svgRef} className="w-full h-full cursor-move" style={{ maxWidth: '100%', maxHeight: '100%' }}></svg>

            {/* Controls Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-4 max-w-xs pointer-events-none">
                {/* Search */}
                <div className="glass-panel p-3 rounded-xl pointer-events-auto shadow-sm">
                    <input
                        type="text"
                        placeholder="Filter graph..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400"
                    />
                </div>

                {/* Tag Filters */}
                {allTags.length > 0 && (
                    <div className="glass-panel p-3 rounded-xl pointer-events-auto shadow-sm flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto CustomScrollbar">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTags(prev =>
                                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                )}
                                className={`
                                    text-xs px-2 py-1 rounded-full border transition-all
                                    ${selectedTags.includes(tag)
                                        ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-100'
                                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700'}
                                `}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Tooltip / Info Panel */}
            {hoveredNode && (
                <div className="absolute top-4 right-4 p-4 glass-card rounded-xl max-w-xs animate-fade-in pointer-events-none">
                    <h3 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100">{hoveredNode.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {hoveredNode.tags.length > 0 ? hoveredNode.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                                #{tag}
                            </span>
                        )) : <span className="text-xs text-stone-400">No tags</span>}
                    </div>
                </div>
            )}

            {/* Empty State Overlay */}
            {data.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-stone-400 font-serif italic text-lg">Your mind is still... empty. Create notes to weave the web.</p>
                </div>
            )}
        </div>
    );
};

export default MindWeaver;
