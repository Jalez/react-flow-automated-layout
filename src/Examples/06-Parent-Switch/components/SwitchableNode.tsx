import { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { availableParents } from '../initialElements';

// Static styles as constants
const styles = {
    button: {
        base: {
            borderRadius: '3px',
            padding: '5px',
            fontSize: '12px',

            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        parent1: {
            default: { backgroundColor: '#bbdefb', border: '1px solid #2196f3', color: '#1565c0' },
            hover: { backgroundColor: '#90caf9', border: '1px solid #2196f3', color: '#1565c0' },
        },
        parent2: {
            default: { backgroundColor: '#c8e6c9', border: '1px solid #4caf50', color: '#2e7d32' },
            hover: { backgroundColor: '#a5d6a7', border: '1px solid #4caf50', color: '#2e7d32' },
        }
    },
    node: {

        background: 'white',
        border: '1px solid #ddd',
        transition: 'all 0.3s ease',
    },
    handle: {
        width: '8px',
        height: '8px',
        background: '#ddd',
        border: '2px solid white',
        transition: 'all 0.2s ease',
    }
};

export interface SwitchableNodeData {
    label: string;
    oldParentId?: string;
    [key: string]: unknown;
}

const SwitchableNode = ({ id, data, selected = false }: NodeProps) => {

    const nodeData = data as SwitchableNodeData;
    const { updateNode, getNode } = useReactFlow();
    const node = getNode(id);
    // Only filter available parents that aren't the current parent
    const handleButtonClick = (parentId: string) => {
        updateNode(id, { parentId, data: { ...nodeData, oldParentId: node?.parentId } });
    }

    // Filter available parents to exclude the current parent
    const filteredAvailableParents = availableParents.filter(parent => parent.id !== node?.parentId);
    return (
        <div
            style={{
                ...styles.node,
                boxShadow: selected ? '0 0 0 2px #1a192b' : 'none',
                transform: selected ? 'scale(1.05)' : 'scale(1)',
                width: node?.style?.width || 'auto',
                height: node?.style?.height || 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',

            }}
        >
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>
                {nodeData.label}
            </div>

            {filteredAvailableParents.length > 0 && (

                <>
                    {
                        filteredAvailableParents.map(parent => (
                            <button
                                key={parent.id}
                                style={{
                                    ...styles.button.base,
                                    ...styles.button[parent.id === 'parent1' ? 'parent1' : 'parent2'].default
                                }}
                                onClick={() => handleButtonClick(parent.id)}
                                onMouseEnter={(e) => {
                                    const target = e.currentTarget;
                                    const buttonStyle = styles.button[parent.id === 'parent1' ? 'parent1' : 'parent2'].hover;
                                    Object.assign(target.style, buttonStyle);
                                }}
                                onMouseLeave={(e) => {
                                    const target = e.currentTarget;
                                    const buttonStyle = styles.button[parent.id === 'parent1' ? 'parent1' : 'parent2'].default;
                                    Object.assign(target.style, buttonStyle);
                                }}
                            >
                                Switch to {parent.label}
                            </button>
                        ))
                    }
                </>

            )}

            <Handle
                type="target"
                position={Position.Top}
                style={{ ...styles.handle, top: '-4px' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ ...styles.handle, bottom: '-4px' }}
            />
        </div>
    );
};

export default memo(SwitchableNode);