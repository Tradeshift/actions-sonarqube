import {saveState, getState} from '@actions/core';

export const isPost = getState('isPost') === 'true';
export const proxyContainer = getState('proxyContainer');
export const actionStartedAt = new Date(getState('actionStartedAt'));

export function setIsPost(): void {
  saveState('isPost', 'true');
}

export function setProxyContainer(id: string): void {
  saveState('proxyContainer', id);
}

export function setActionStartedAt(date: Date): void {
  saveState('actionStartedAt', date.toJSON());
}
