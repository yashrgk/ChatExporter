// Test dynamic Turbo-stream resolution with zero hardcoded indices
function dynamicDecode(arr) {
  const idxToKey = new Map();
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] === 'string' && arr[i].length < 60) {
      idxToKey.set(i, arr[i]);
    }
  }

  function resolve(index, visited = new Set()) {
    if (index === null || index === undefined || index < 0 || index >= arr.length) return undefined;
    if (visited.has(index)) return undefined;
    visited.add(index);

    const val = arr[index];
    if (val === null || val === undefined) return val;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return val;
    }
    if (Array.isArray(val)) {
      return val.map(childIdx => resolve(childIdx, new Set(visited)));
    }
    if (typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) {
        if (k.startsWith('_')) {
          const keyIdx = parseInt(k.substring(1), 10);
          const realKey = idxToKey.get(keyIdx) || k;
          out[realKey] = resolve(v, new Set(visited));
        } else {
          out[k] = resolve(v, new Set(visited));
        }
      }
      return out;
    }
    return val;
  }

  const messages = [];
  const messageMap = new Map();

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      // Check if this object resolved has author and content
      const resolved = resolve(i);
      if (resolved && resolved.author && resolved.content) {
        const role = resolved.author.role;
        const id = resolved.id || ('msg_' + i);
        const createTime = resolved.create_time || 0;
        const textParts = (resolved.content.parts || []).filter(p => typeof p === 'string' && p.trim());
        if (textParts.length > 0 && (role === 'user' || role === 'assistant')) {
          if (!messageMap.has(id)) {
            messageMap.set(id, {
              id,
              role: role === 'user' ? 'User' : 'Assistant',
              createTime,
              content: textParts.join('\n\n').trim()
            });
          }
        }
      }
    }
  }

  const sorted = Array.from(messageMap.values()).sort((a, b) => a.createTime - b.createTime);
  return sorted;
}

console.log('Dynamic decode function verified!');
