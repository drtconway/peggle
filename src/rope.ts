
interface AtomNode {kind: 'atom', atom: string};
interface SubNode {kind: 'sub', src: RopeNode, begin: number, end: number};
interface CatNode {kind: 'cat', lhs: RopeNode, rhs: RopeNode, lhsLen: number};

type RopeNode = AtomNode | SubNode | CatNode;

function calculateLength(n : RopeNode) : number {
    switch (n.kind) {
        case 'atom': {
            return n.atom.length;
        }
        case 'sub': {
            return n.end - n.begin;
        }
        case 'cat': {
            return n.lhsLen + calculateLength(n.rhs);
        }
    }
}

function makeString(n : RopeNode, begin: number, end: number, parts: string[]) {
    switch (n.kind) {
        case 'atom': {
            parts.push(n.atom.substring(begin, end));
            return;
        }
        case 'sub': {
            makeString(n.src, n.begin + begin, n.begin + end, parts);
            return;
        }
        case 'cat': {
            if (end <= n.lhsLen) {
                makeString(n.lhs, begin, end, parts);
                return;
            }
            if (begin >= n.lhsLen) {
                begin -= n.lhsLen;
                end -= n.lhsLen;
                makeString(n.rhs, begin, end, parts);
                return;
            }
            makeString(n.lhs, begin, n.lhsLen, parts);
            makeString(n.rhs, 0, end - n.lhsLen, parts);
        }
    }
}

export class Rope {
    root: RopeNode;
    length: number;

    private constructor(root: RopeNode) {
        this.root = root;
        this.length = calculateLength(this.root);
    }

    static atom(str : string) : Rope {
        return new Rope({kind: 'atom', atom: str});
    }

    static cat(lhs: Rope, rhs: Rope) : Rope {
        return new Rope({kind: 'cat', lhs: lhs.root, rhs: rhs.root, lhsLen: lhs.length});
    }

    slice(begin: number, end: number) {
        return new Rope({kind: 'sub', src: this.root, begin, end});
    }

    peek(i : number) : string {
        let n = this.root;
        while (true) {
            switch (n.kind) {
                case 'atom': {
                    return n.atom[i];
                }
                case 'sub': {
                    i += n.begin;
                    n = n.src;
                    break;
                }
                case 'cat': {
                    if (i < n.lhsLen) {
                        n = n.lhs;
                        break;
                    } else {
                        i -= n.lhsLen;
                        n = n.rhs;
                        break;
                    }
                }
            }
        }
    }

    toString() : string {
        let parts : string[] = [];
        makeString(this.root, 0, this.length, parts);
        return parts.join('');
    }
}