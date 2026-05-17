export interface ChunkSelectStrategy {
    next: () => number | false;
    hasNext: () => boolean;
}

export class SequentialChunkSelector implements ChunkSelectStrategy {
    private current: number = 1;
    private total: number;

    constructor(total: number) {
        this.total = total;
    }

    next(): number | false {
        const next = this.current++;
        if (next > this.total) return false;
        return next;
    }

    hasNext() {
        if (this.current > this.total) return false;
        else return true;
    }
}

export class ResumedChunkSelector implements ChunkSelectStrategy {
    private notReadyChunks: number[];
    private currentIndex: number = 0;

    constructor(readyChunks: number[], chunksCount: number) {
        this.notReadyChunks = this.getNotReadyChunks(readyChunks, chunksCount);
    }

    next() {
        const nextIndex = this.currentIndex++;
        if (nextIndex >= this.notReadyChunks.length) return false;
        else return this.notReadyChunks[nextIndex];
    }

    hasNext() {
        if (this.currentIndex >= this.notReadyChunks.length) return false;
        else return true;
    }

    private getNotReadyChunks(readyChunks: number[], chunksCount: number): number[] {
        const ready = new Set(readyChunks);

        const needSend = [];
        for (let i = 1; i <= chunksCount; i++) {
            if (!ready.has(i)) needSend.push(i);
        }

        return needSend;
    }
}