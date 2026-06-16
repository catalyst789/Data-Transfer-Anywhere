export type Role = 'sender' | 'receiver';

export interface FileMeta {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
}

export type ChannelMessage =
  | ({ type: 'file-start' } & FileMeta)
  | { type: 'file-end'; fileId: string }
  | { type: 'text'; content: string };

export interface TransferItem {
  fileId: string;
  name: string;
  size: number;
  /** 0–100 */
  progress: number;
  status: 'queued' | 'transferring' | 'done' | 'error';
  /** Receiver only: object URL for download */
  downloadUrl?: string;
}

export interface PeerInfo {
  peerId: string;
  status: 'connecting' | 'connected' | 'disconnected';
}
