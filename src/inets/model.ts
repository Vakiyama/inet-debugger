export type Root = { type: 'root' };

const root: Root = { type: 'root' };

export type Eraser = { type: 'eraser' };
export type Number = { type: 'number'; value: number };
export type Reference = { type: 'reference'; id: string };

export type UnaryNode = (Eraser | Number | Reference) & { primary: Node };

type BaseBinary<T extends string> = {
  lhs: Node;
  rhs: Node;
  primary: Node;
  type: T;
};

export type Constructor = BaseBinary<'constructor'>;
export type Duplicator = BaseBinary<'duplicator'>;
export type Operator = BaseBinary<'operator'>;
export type Switch = BaseBinary<'switch'>;

export type BinaryNode = (Constructor | Duplicator | Operator | Switch) & {
  lhs: Node;
  rhs: Node;
  primary: Node;
};

export type Node = BinaryNode | UnaryNode | Root;

// cases:
// Con ~ Con [x]
// Con ~ Dup [x]
// Con ~ Eraser [x]
// Dup ~ Dup [x]
// Dup ~ Eraser [x]
// Eraser ~ Eraser [x] Ouroboros
// todo:
// Switch 1
// Switch 2
// Operate 1
// Operate 2
// Call
// Link?

function assert(truthy: any, msg: string) {
  if (!truthy) throw new Error(msg);
}

// todo: implement this function for references, the "Call" interaction
function replaceReference() { }

function interact(a: Node, b: Node) {
  // check replace references
  if (a.type === 'root' || b.type === 'root')
    throw new Error('Cannot interact root nodes');

  assert(
    a.primary === b && b.primary === a,
    'Nodes cannot interact, primary ports have different references'
  );

  // Con ~ Con
  if (a.type === 'constructor' && b.type === 'constructor') {
    const portLhsA = findPortToSelf(a, a.lhs);
    const portRhsA = findPortToSelf(a, a.lhs);
    if (portLhsA === 'none' || portRhsA === 'none') throw new Error('?');

    const lhsNodeA = a.lhs;
    const rhsNodeA = a.rhs;

    const portLhsB = findPortToSelf(a, a.lhs);
    const portRhsB = findPortToSelf(a, a.lhs);
    if (portLhsB === 'none' || portRhsB === 'none') throw new Error('?');

    const lhsNodeB = b.lhs;
    const rhsNodeB = b.rhs;

    (lhsNodeA as BinaryNode)[portLhsA] = rhsNodeB;
    (rhsNodeB as BinaryNode)[portRhsB] = lhsNodeA;

    (lhsNodeB as BinaryNode)[portLhsB] = rhsNodeA;
    (rhsNodeA as BinaryNode)[portRhsA] = lhsNodeB;
  }

  // Con ~ Dup
  if (a.type === 'constructor' && b.type === 'duplicator') {
    const dupA: Duplicator = {
      type: 'duplicator',
      lhs: root /* conA */,
      rhs: root /* conB*/,
      primary: a.rhs,
    };

    const dupB: Duplicator = {
      type: 'duplicator',
      primary: a.lhs,
      lhs: root,
      rhs: root,
    };

    const conA: Constructor = {
      type: 'constructor',
      lhs: dupB,
      rhs: dupA,
      primary: b.lhs,
    };

    const conB: Constructor = {
      type: 'constructor',
      lhs: dupB,
      rhs: dupA,
      primary: b.rhs,
    };

    dupA.lhs = conA;
    dupA.rhs = conB;
    conB.lhs = dupA;
    conB.rhs = dupB;
  }

  // Con ~ Era || Dup ~ Era (these behave the same)
  if (
    (a.type === 'constructor' || a.type === 'duplicator') &&
    b.type === 'eraser'
  ) {
    const portLhs = findPortToSelf(a, a.lhs);
    const portRhs = findPortToSelf(a, a.rhs);

    if (portLhs === 'none' || portRhs === 'none')
      throw new Error('No self reference');

    (a.lhs as BinaryNode)[portLhs] = { type: 'eraser', primary: a };
    (a.rhs as BinaryNode)[portRhs] = { type: 'eraser', primary: a };
  }

  // Dup ~ Dup
  if (a.type === 'duplicator' && b.type === 'duplicator') {
    const portLhsA = findPortToSelf(a, a.lhs);
    const portRhsA = findPortToSelf(a, a.lhs);
    if (portLhsA === 'none' || portRhsA === 'none') throw new Error('?');

    const lhsNodeA = a.lhs;
    const rhsNodeA = a.rhs;

    const portLhsB = findPortToSelf(a, a.lhs);
    const portRhsB = findPortToSelf(a, a.lhs);
    if (portLhsB === 'none' || portRhsB === 'none') throw new Error('?');

    const lhsNodeB = b.lhs;
    const rhsNodeB = b.rhs;

    (lhsNodeA as BinaryNode)[portLhsA] = lhsNodeB;
    (rhsNodeB as BinaryNode)[portRhsB] = rhsNodeA;

    (lhsNodeB as BinaryNode)[portLhsB] = lhsNodeA;
    (rhsNodeA as BinaryNode)[portRhsA] = rhsNodeB;
  }

  // Era ~ Era
  if (a.type === 'eraser' && a.type === 'eraser') {
    console.log('Ouroboros');
  }

  // Num ~ Swi
  if (a.type === 'number' && b.type === 'duplicator') {
  }
}


function isBinary(node: Node) {
  return Object.keys(node).includes('lhs');
}

function findPortToSelf(
  self: Node,
  target: Node
): 'primary' | 'lhs' | 'rhs' | 'none' {
  if (target.type === 'root') throw new Error('Target cannot be a root node');
  if (target.primary === self) return 'primary';
  if (isBinary(target)) {
    if ((target as BinaryNode).lhs === self) return 'lhs';
    if ((target as BinaryNode).rhs === self) return 'rhs';
  }
  return 'none';
}
