interface Component {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export async function detectSpriteGrid(imageUrl: string): Promise<{ columns: number; rows: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const W = img.width;
      const H = img.height;
      
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, W, H);
      const data = imageData.data;
      
      const components = findConnectedComponents(data, W, H);
      
      if (components.length === 0) {
        resolve(null); // No non-transparent pixels found
        return;
      }

      const columns = getBestDivisor(W, components, true);
      const rows = getBestDivisor(H, components, false);
      
      resolve({ columns, rows });
    };
    
    img.onerror = () => {
      resolve(null);
    };
    
    img.src = imageUrl;
  });
}

function findConnectedComponents(data: Uint8ClampedArray, W: number, H: number): Component[] {
  const visited = new Uint8Array(W * H);
  const components: Component[] = [];
  
  const q = new Int32Array(W * H); // Pre-allocate queue to avoid GC overhead
  
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (visited[i]) continue;
      
      // Check alpha channel (index 3)
      const alpha = data[i * 4 + 3];
      if (alpha < 10) {
        visited[i] = 1;
        continue;
      }
      
      // Found a new component, perform BFS
      let minX = x, maxX = x, minY = y, maxY = y;
      
      let qHead = 0;
      let qTail = 0;
      
      q[qTail++] = i;
      visited[i] = 1;
      
      while (qHead < qTail) {
        const curr = q[qHead++];
        const cx = curr % W;
        const cy = Math.floor(curr / W);
        
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        
        // Check 4 neighbors
        // Left
        if (cx > 0) {
          const ni = curr - 1;
          if (!visited[ni]) {
            visited[ni] = 1;
            if (data[ni * 4 + 3] >= 10) q[qTail++] = ni;
          }
        }
        // Right
        if (cx < W - 1) {
          const ni = curr + 1;
          if (!visited[ni]) {
            visited[ni] = 1;
            if (data[ni * 4 + 3] >= 10) q[qTail++] = ni;
          }
        }
        // Up
        if (cy > 0) {
          const ni = curr - W;
          if (!visited[ni]) {
            visited[ni] = 1;
            if (data[ni * 4 + 3] >= 10) q[qTail++] = ni;
          }
        }
        // Down
        if (cy < H - 1) {
          const ni = curr + W;
          if (!visited[ni]) {
            visited[ni] = 1;
            if (data[ni * 4 + 3] >= 10) q[qTail++] = ni;
          }
        }
      }
      
      components.push({ minX, maxX, minY, maxY });
    }
  }
  
  return components;
}

function getBestDivisor(length: number, components: Component[], isCol: boolean): number {
  const candidates = [];
  
  for (let c = 1; c <= length; c++) {
    // For now, we assume spacing = 0 and padding = 0, so it must divide perfectly.
    // If we wanted to support padding/spacing, the math here would iterate over valid (c, spacing, padding) tuples.
    if (length % c !== 0) continue;
    
    const frameSize = length / c;
    let valid = true;
    const occupiedCells = new Set<number>();
    
    for (const comp of components) {
      const min = isCol ? comp.minX : comp.minY;
      const max = isCol ? comp.maxX : comp.maxY;
      
      const idxLeft = Math.floor(min / frameSize);
      const idxRight = Math.floor(max / frameSize);
      
      // If a single connected component spans across a grid boundary, this divisor is invalid.
      if (idxLeft !== idxRight) {
        valid = false;
        break;
      }
      
      occupiedCells.add(idxLeft);
    }
    
    if (valid) {
      candidates.push({
        count: c,
        occupied: occupiedCells.size,
        total: c
      });
    }
  }
  
  if (candidates.length === 0) return 1;
  
  // Sort candidates to find the best one:
  // 1. Maximize the number of occupied frames
  // 2. Break ties by minimizing the total number of frames (avoids over-segmenting)
  candidates.sort((a, b) => {
    if (b.occupied !== a.occupied) {
      return b.occupied - a.occupied;
    }
    return a.total - b.total;
  });
  
  return candidates[0].count;
}
