export const IPC = {
	UI_TASK_REQ: "ui-task-req",
	UI_TASK_RES: "ui-task-res",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
