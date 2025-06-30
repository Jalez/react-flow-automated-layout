import { useNodes, StepEdge, EdgeProps } from '@xyflow/react'
import { pathfindingJumpPointNoDiagonal, SmartEdge, SmartEdgeOptions, svgDrawStraightLinePath } from '@jalez/react-flow-smart-edge'



const StepConfiguration: SmartEdgeOptions = {
	drawEdge: svgDrawStraightLinePath,
	generatePath: pathfindingJumpPointNoDiagonal,
    nodePadding: 40,
	fallback: StepEdge as any // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
}

export function SmartStepEdgeExt(props: EdgeProps) {
	const nodes = useNodes()

	return <SmartEdge {...props} options={StepConfiguration} nodes={nodes} />
}
