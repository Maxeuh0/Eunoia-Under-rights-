import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

const GlassNode = ({ data, selected }: NodeProps) => {
    return (
        <div className={`
      px-5 py-4 shadow-lg rounded-2xl group
      bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl 
      border transition-all duration-300 w-64
      ${selected
                ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10'
                : 'border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700'}
    `}>
            {/* Handles for connecting nodes - All 4 sides for flexibility. All are sources in Loose mode. */}
            <Handle type="source" position={Position.Top} id="top" className="!bg-stone-400 !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-all" />
            <Handle type="source" position={Position.Left} id="left" className="!bg-stone-400 !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-all" />

            <div className="font-serif font-medium text-stone-800 dark:text-stone-100 text-sm line-clamp-6 leading-relaxed select-none pointer-events-none">
                {data.label as string}
            </div>

            <Handle type="source" position={Position.Right} id="right" className="!bg-stone-400 !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-all" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-stone-400 !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-all" />
        </div>
    );
};

export default memo(GlassNode);
