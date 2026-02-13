import React, { useEffect, useRef, useState } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { ZoomIn, ZoomOut, RefreshCw, Layers, Maximize } from 'lucide-react';

interface IntelligenceGraphProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

interface SimNode extends GraphNode {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
}

const IntelligenceGraph: React.FC<IntelligenceGraphProps> = ({ nodes, edges }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [simNodes, setSimNodes] = useState<SimNode[]>([]);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const animationRef = useRef<number>(0);

    // Color Mapping
    const getColor = (type: string) => {
        switch (type) {
            case 'PROJECT': return '#3B82F6'; // Blue
            case 'RISK': return '#F43F5E'; // Red
            case 'REQUIREMENT': return '#10B981'; // Emerald
            case 'STAKEHOLDER': return '#8B5CF6'; // Purple
            case 'AUDIT_SCORE': return '#F59E0B'; // Amber
            default: return '#64748B'; // Slate
        }
    };

    const getRadius = (type: string) => {
        return type === 'PROJECT' ? 25 : type === 'RISK' ? 18 : 12;
    };

    // Initialize Simulation
    useEffect(() => {
        if (!nodes.length) return;

        const width = svgRef.current?.clientWidth || 800;
        const height = svgRef.current?.clientHeight || 600;

        const initialNodes: SimNode[] = nodes.map((n, i) => ({
            ...n,
            x: width / 2 + (Math.random() - 0.5) * 200,
            y: height / 2 + (Math.random() - 0.5) * 200,
            vx: 0,
            vy: 0,
            radius: getRadius(n.type)
        }));

        setSimNodes(initialNodes);
    }, [nodes]);

    // Physics Loop
    useEffect(() => {
        if (simNodes.length === 0) return;

        const runSimulation = () => {
            setSimNodes(prevNodes => {
                const newNodes = prevNodes.map(n => ({ ...n }));
                const width = svgRef.current?.clientWidth || 800;
                const height = svgRef.current?.clientHeight || 600;
                const k = 0.05; // Spring constant
                const repulsion = 3000; // Repulsion force
                const damping = 0.85;

                // 1. Repulsion (Nodes push apart)
                for (let i = 0; i < newNodes.length; i++) {
                    for (let j = i + 1; j < newNodes.length; j++) {
                        const dx = newNodes[i].x - newNodes[j].x;
                        const dy = newNodes[i].y - newNodes[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        if (dist < 300) {
                            const force = repulsion / (dist * dist);
                            const fx = (dx / dist) * force;
                            const fy = (dy / dist) * force;
                            newNodes[i].vx += fx;
                            newNodes[i].vy += fy;
                            newNodes[j].vx -= fx;
                            newNodes[j].vy -= fy;
                        }
                    }
                }

                // 2. Attraction (Edges pull together)
                edges.forEach(e => {
                    const source = newNodes.find(n => n.id === e.source);
                    const target = newNodes.find(n => n.id === e.target);
                    if (source && target) {
                        const dx = target.x - source.x;
                        const dy = target.y - source.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = (dist - 100) * k; // Resting distance 100
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        source.vx += fx;
                        source.vy += fy;
                        target.vx -= fx;
                        target.vy -= fy;
                    }
                });

                // 3. Center Gravity & Damping & Update
                newNodes.forEach(n => {
                    // Pull to center
                    n.vx += (width / 2 - n.x) * 0.002;
                    n.vy += (height / 2 - n.y) * 0.002;

                    n.vx *= damping;
                    n.vy *= damping;
                    n.x += n.vx;
                    n.y += n.vy;
                });

                return newNodes;
            });

            animationRef.current = requestAnimationFrame(runSimulation);
        };

        animationRef.current = requestAnimationFrame(runSimulation);
        return () => cancelAnimationFrame(animationRef.current!);
    }, [edges, simNodes.length]); 

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scale = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * scale, 0.5), 3));
    };

    return (
        <div className="relative w-full h-[600px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl group">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', 
                     backgroundSize: '20px 20px' 
                 }}>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                <button onClick={() => setZoom(z => Math.min(z + 0.1, 3))} className="p-2 bg-slate-800 text-white rounded hover:bg-slate-700 border border-slate-700"><ZoomIn className="w-4 h-4"/></button>
                <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-2 bg-slate-800 text-white rounded hover:bg-slate-700 border border-slate-700"><ZoomOut className="w-4 h-4"/></button>
                <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-2 bg-slate-800 text-white rounded hover:bg-slate-700 border border-slate-700"><RefreshCw className="w-4 h-4"/></button>
            </div>

            <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <Layers className="w-4 h-4" /> Live Intelligence Graph
                </div>
            </div>

            <svg 
                ref={svgRef}
                className="w-full h-full cursor-move"
                onWheel={handleWheel}
                onMouseDown={(e) => {
                    const start = { x: e.clientX - pan.x, y: e.clientY - pan.y };
                    const onMove = (mv: MouseEvent) => {
                        setPan({ x: mv.clientX - start.x, y: mv.clientY - start.y });
                    };
                    const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                }}
            >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {/* Edges */}
                    {edges.map((e, i) => {
                        const s = simNodes.find(n => n.id === e.source);
                        const t = simNodes.find(n => n.id === e.target);
                        if (!s || !t) return null;
                        return (
                            <line 
                                key={i}
                                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                                stroke="#475569"
                                strokeWidth={1}
                                strokeOpacity={0.4}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {simNodes.map((n) => (
                        <g 
                            key={n.id} 
                            transform={`translate(${n.x}, ${n.y})`}
                            onMouseEnter={() => setHoveredNode(n.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onClick={(e) => { e.stopPropagation(); setSelectedNode(n); }}
                            className="cursor-pointer transition-all duration-300"
                            style={{ opacity: hoveredNode && hoveredNode !== n.id ? 0.3 : 1 }}
                        >
                            {/* Glow Effect */}
                            <circle r={n.radius * 1.5} fill={getColor(n.type)} fillOpacity={0.1} className="animate-pulse" />
                            
                            {/* Core Node */}
                            <circle 
                                r={n.radius} 
                                fill={getColor(n.type)} 
                                stroke={hoveredNode === n.id ? '#FFF' : 'none'}
                                strokeWidth={2}
                                className="shadow-lg"
                            />
                            
                            {/* Label */}
                            <text 
                                dy={n.radius + 15} 
                                textAnchor="middle" 
                                className="text-[8px] fill-slate-300 font-mono pointer-events-none uppercase tracking-wide"
                                style={{ textShadow: '0 1px 2px black' }}
                            >
                                {n.label.length > 15 ? n.label.substring(0, 15) + '..' : n.label}
                            </text>

                            {/* Icon Logic (Simplified) */}
                            {n.type === 'RISK' && <text dy={4} textAnchor="middle" fill="white" fontSize={10}>⚠️</text>}
                            {n.type === 'PROJECT' && <text dy={4} textAnchor="middle" fill="white" fontSize={10}>★</text>}
                        </g>
                    ))}
                </g>
            </svg>

            {/* Detail Overlay */}
            {selectedNode && (
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl animate-slide-up flex justify-between items-start z-30">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: getColor(selectedNode.type)}}></span>
                            <span className="text-xs font-bold text-slate-400 uppercase">{selectedNode.type}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{selectedNode.label}</h3>
                        <p className="text-sm text-slate-400 mt-1 max-w-xl">
                            {JSON.stringify(selectedNode.data || { info: "Node detailed properties" })}
                        </p>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white"><Maximize className="w-5 h-5"/></button>
                </div>
            )}
        </div>
    );
};

export default IntelligenceGraph;