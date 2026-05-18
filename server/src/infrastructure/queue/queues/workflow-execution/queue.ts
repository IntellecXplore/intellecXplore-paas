import { queueManager } from '../../core';

const WorkflowExecutionQueue = queueManager.registerQueue({
    name: 'workflow-execution-queue',
    description: '工作流执行队列',
});

export default WorkflowExecutionQueue;
