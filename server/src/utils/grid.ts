import { type RectangleHitbox } from "../../../common/src/utils/hitbox";
import { clamp } from "../../../common/src/utils/math";
import { type Vector, v } from "../../../common/src/utils/vector";
import { type GameObject } from "../types/gameObject";

export class Grid {
    readonly width: number;
    readonly height: number;
    readonly cellSize: number;

    private readonly _grid: Record<number, Record<number, Map<number, GameObject>>> = {};

    constructor(width: number, height: number, cellSize: number) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;

        for (let x = 0; x <= width; x += cellSize) {
            this._grid[x] = {};
            for (let y = 0; y <= height; y += cellSize) {
                this._grid[x][y] = new Map();
            }
        }
    }

    addObject(object: GameObject): void {
        if (object.hitbox === undefined) {
            const pos = this._roundToCells(object.position);
            this._grid[pos.x][pos.y].set(object.id, object);
        } else {
            // get the bounds of the hitbox
            const rect = object.hitbox.toRectangle();
            // round it to the grid cells
            const min = this._roundToCells(rect.min);
            const max = this._roundToCells(rect.max);

            // add it to all grid cells that it intersects
            for (let x = min.x; x <= max.x; x += this.cellSize) {
                for (let y = min.y; y <= max.y; y += this.cellSize) {
                    this._grid[x][y].set(object.id, object);
                    object.gridCells.push(v(x, y));
                }
            }
        }
    }

    removeObject(object: GameObject): void {
        for (const cell of object.gridCells) {
            this._grid[cell.x][cell.y].delete(object.id);
        }
        object.gridCells = [];
    }

    /**
     * Get all objects intersecting a rectangle rounded up to the grid cells
     * @param rect The rectangle
     * @return A set with the objects
     */
    intersectsRect(rect: RectangleHitbox): Set<GameObject> {
        const objects = new Set<GameObject>();

        const objectsAdded = new Map<number, boolean>();

        const min = this._roundToCells(rect.min);
        const max = this._roundToCells(rect.max);

        for (let x = min.x; x <= max.x; x += this.cellSize) {
            for (let y = min.y; y <= max.y; y += this.cellSize) {
                for (const i of this._grid[x][y]) {
                    const id = i[0];
                    if (!objectsAdded.get(id)) {
                        objectsAdded.set(id, true);
                        objects.add(i[1]);
                    }
                }
            }
        }

        return objects;
    }

    private _roundToCells(vector: Vector): Vector {
        return v(clamp(Math.floor(vector.x / this.cellSize) * this.cellSize, 0, this.width),
            clamp(Math.floor(vector.y / this.cellSize) * this.cellSize, 0, this.height));
    }
}
