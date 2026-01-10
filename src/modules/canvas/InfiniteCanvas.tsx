import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    MiniMap,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge,
    ReactFlowProvider,
    useReactFlow,
    type Node,
    ConnectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../../context/StoreContext';
import GlassNode from './GlassNode';

const initialNodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Welcome to your Infinite Canvas' }, type: 'glass' },
];
const initialEdges: Edge[] = [];

const CanvasFlow = () => {
    const { notes, createNote } = useStore();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { screenToFlowPosition } = useReactFlow();

    const nodeTypes = useMemo(() => ({ glass: GlassNode }), []);

    // Load State
    useEffect(() => {
        const savedFlow = localStorage.getItem('eunoia_canvas_flow');
        if (savedFlow) {
            const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedFlow);
            setNodes(savedNodes || initialNodes);
            setEdges(savedEdges || initialEdges);
        }
    }, [setNodes, setEdges]);

    // Save State (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const flow = { nodes, edges };
            localStorage.setItem('eunoia_canvas_flow', JSON.stringify(flow));
        }, 1000);
        return () => clearTimeout(timer);
    }, [nodes, edges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            let noteId = event.dataTransfer.getData('noteId');
            let content = event.dataTransfer.getData('content');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            // Fix Ghost Notes: Create a real note if it's a new empty node
            if (!noteId) {
                content = "New Thought";
                noteId = createNote(content);
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: noteId,
                type,
                position,
                data: { label: content },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes, createNote],
    );

    const onDragStart = (event: React.DragEvent, nodeType: string, noteContent: string, noteId?: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('content', noteContent);
        if (noteId) event.dataTransfer.setData('noteId', noteId);
        event.dataTransfer.effectAllowed = 'move';
    };

    const applyTemplate = (type: 'eisenhower' | 'kanban' | 'mindmap') => {
        const center = { x: 250, y: 150 };
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const timestamp = Date.now();

        if (type === 'eisenhower') {
            newNodes.push(
                { id: `e-${timestamp}-1`, type: 'glass', position: { x: center.x, y: center.y }, data: { label: 'Do First' } },
                { id: `e-${timestamp}-2`, type: 'glass', position: { x: center.x + 300, y: center.y }, data: { label: 'Schedule' } },
                { id: `e-${timestamp}-3`, type: 'glass', position: { x: center.x, y: center.y + 200 }, data: { label: 'Delegate' } },
                { id: `e-${timestamp}-4`, type: 'glass', position: { x: center.x + 300, y: center.y + 200 }, data: { label: 'Eliminate' } }
            );
        } else if (type === 'kanban') {
            newNodes.push(
                { id: `k-${timestamp}-1`, type: 'glass', position: { x: center.x, y: center.y }, data: { label: 'To Do' } },
                { id: `k-${timestamp}-2`, type: 'glass', position: { x: center.x + 300, y: center.y }, data: { label: 'Doing' } },
                { id: `k-${timestamp}-3`, type: 'glass', position: { x: center.x + 600, y: center.y }, data: { label: 'Done' } }
            );
        } else if (type === 'mindmap') {
            const centerId = `m-${timestamp}-center`;
            newNodes.push(
                { id: centerId, type: 'glass', position: { x: center.x, y: center.y }, data: { label: 'Central Topic' } },
                { id: `m-${timestamp}-1`, type: 'glass', position: { x: center.x - 250, y: center.y - 150 }, data: { label: 'Topic A' } },
                { id: `m-${timestamp}-2`, type: 'glass', position: { x: center.x + 250, y: center.y - 150 }, data: { label: 'Topic B' } },
                { id: `m-${timestamp}-3`, type: 'glass', position: { x: center.x - 250, y: center.y + 150 }, data: { label: 'Topic C' } },
                { id: `m-${timestamp}-4`, type: 'glass', position: { x: center.x + 250, y: center.y + 150 }, data: { label: 'Topic D' } }
            );
            newEdges.push(
                { id: `e-${timestamp}-1`, source: centerId, target: `m-${timestamp}-1`, type: 'smoothstep', animated: true },
                { id: `e-${timestamp}-2`, source: centerId, target: `m-${timestamp}-2`, type: 'smoothstep', animated: true },
                { id: `e-${timestamp}-3`, source: centerId, target: `m-${timestamp}-3`, type: 'smoothstep', animated: true },
                { id: `e-${timestamp}-4`, source: centerId, target: `m-${timestamp}-4`, type: 'smoothstep', animated: true }
            );
        }

        setNodes((nds) => nds.concat(newNodes));
        setEdges((eds) => eds.concat(newEdges));
    };

    return (
        <div className="w-full h-full glass-panel rounded-3xl overflow-hidden relative flex">
            {/* Notes Palette */}
            <div className="w-64 border-r border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 p-4 hidden md:flex flex-col z-20">
                <h3 className="font-serif font-bold text-lg mb-4 text-stone-700 dark:text-stone-300">Thoughts</h3>
                <div className="flex-1 overflow-y-auto CustomScrollbar space-y-2">
                    {/* Default Node */}
                    <div
                        className="p-3 bg-white dark:bg-stone-800 rounded shadow-sm cursor-grab active:cursor-grabbing border border-stone-200 dark:border-stone-700 hover:border-amber-400 transition-colors"
                        onDragStart={(event) => onDragStart(event, 'glass', 'New Node')}
                        draggable
                    >
                        <span className="text-sm font-medium text-stone-600 dark:text-stone-300">⬜ Empty Node</span>
                    </div>

                    <div className="h-px bg-stone-200 dark:bg-stone-800 my-2"></div>

                    <h3 className="font-serif font-bold text-sm mb-2 text-stone-500 uppercase tracking-wider">Templates</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => applyTemplate('eisenhower')}
                            className="p-2 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-stone-600 dark:text-stone-300 rounded border border-transparent hover:border-amber-200 transition-colors"
                        >
                            Eisenhower
                        </button>
                        <button
                            onClick={() => applyTemplate('kanban')}
                            className="p-2 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-stone-600 dark:text-stone-300 rounded border border-transparent hover:border-amber-200 transition-colors"
                        >
                            Kanban
                        </button>
                        <button
                            onClick={() => applyTemplate('mindmap')}
                            className="p-2 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-stone-600 dark:text-stone-300 rounded border border-transparent hover:border-amber-200 transition-colors col-span-2"
                        >
                            Mind Map
                        </button>
                    </div>

                    <div className="h-px bg-stone-200 dark:bg-stone-800 my-2"></div>
                    <h3 className="font-serif font-bold text-sm mb-2 text-stone-500 uppercase tracking-wider">Thoughts</h3>

                    {/* Existing Notes */}
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className="p-3 bg-white dark:bg-stone-800 rounded shadow-sm cursor-grab active:cursor-grabbing border border-stone-200 dark:border-stone-700 hover:border-amber-400 transition-colors"
                            onDragStart={(event) => onDragStart(event, 'glass', note.content, note.id)}
                            draggable
                        >
                            <p className="text-xs font-medium text-stone-600 dark:text-stone-300 truncate">
                                {note.content.split('\n')[0] || 'Untitled'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    connectionMode={ConnectionMode.Loose}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#d97706', strokeWidth: 2 },
                        interactionWidth: 20, // Easier to click
                    }}
                    deleteKeyCode={['Backspace', 'Delete']}
                    proOptions={{ hideAttribution: true }}
                    fitView
                    className="bg-stone-50/50 dark:bg-stone-900/50"
                >
                    <MiniMap
                        className="!bg-stone-100/50 dark:!bg-stone-900/50 backdrop-blur-md !border !border-stone-200 dark:!border-stone-700 !rounded-xl overflow-hidden shadow-lg"
                        nodeColor={(n) => {
                            if (n.type === 'glass') return '#d97706'; // Amber-600
                            return '#78716c'; // Stone-500
                        }}
                        maskColor="rgb(0, 0, 0, 0.1)"
                        zoomable
                        pannable
                    />
                    <Background color="#a8a29e" gap={24} size={1} className="opacity-20" />
                </ReactFlow>
            </div>

            <div className="absolute top-4 right-4 z-10 pointer-events-none md:right-16 text-right">
                <h2 className="text-xl font-serif font-bold text-stone-700 dark:text-stone-300">Infinite Canvas</h2>
                <p className="text-sm text-stone-500">Drag to connect • Select & Del to remove</p>
            </div>
        </div>
    );
};

const InfiniteCanvas: React.FC = () => {
    return (
        <ReactFlowProvider>
            <CanvasFlow />
        </ReactFlowProvider>
    );
};

export default InfiniteCanvas;
