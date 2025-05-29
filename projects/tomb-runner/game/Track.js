// Track.js - Handles the game track and environment with a pseudo-3D perspective
class Track {
    constructor(ctx, gameWidth, gameHeight) {
        this.ctx = ctx;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        // Lane properties
        this.numLanes = 3;
        this.laneWidth = gameWidth / 5; // Actual visual width of one lane on screen at z=cameraDepth
        this.roadWidth = this.numLanes * this.laneWidth; // Total width of the road part

        // Track segment properties
        this.segments = [];
        this.segmentLength = 50; // Z-depth of a single segment
        this.rumbleLength = 3;   // Number of segments for one color band of rumble/road

        // Perspective properties
        this.cameraDepth = 0.84; // (FOV = 1 / cameraDepth). Adjust for wider/narrower FOV.
        this.cameraHeight = 1000; // Player's view height from the track
        this.roadLength = 50;    // Number of segments visible on screen (defines draw distance)

        // Track position
        this.positionZ = 0; // Player's current Z position on the track (camera Z)
        this.speed = 150;   // Speed at which positionZ increases (units per second)

        // Colors
        this.colors = {
            lightRoad: '#6B6B6B',
            darkRoad: '#626262',
            lightRumble: '#BCBCBC',
            darkRumble: '#ADADAD',
            grass: '#38A53C'
        };

        this.initializeTrack();
        console.log("Track created and initialized with segments.");
    }

    initializeTrack() {
        this.segments = []; // Clear existing segments if any
        for (let i = 0; i < this.roadLength; i++) {
            const segmentZ = i * this.segmentLength;
            this.segments.push({
                index: i,
                z1: segmentZ,
                z2: segmentZ + this.segmentLength,
                color: this.getSegmentRoadColor(i) // Corrected to getSegmentRoadColor
            });
        }
    }

    getSegmentRoadColor(index) {
        const group = Math.floor(index / this.rumbleLength);
        return group % 2 === 0 ? this.colors.lightRoad : this.colors.darkRoad;
    }

    getSegmentRumbleColor(index) {
        const group = Math.floor(index / this.rumbleLength);
        return group % 2 === 0 ? this.colors.lightRumble : this.colors.darkRumble;
    }

    // Static helper method for 3D to 2D projection
    static project(p, cameraXOffset, cameraY, cameraZ, cameraDepth, gameWidth, gameHeight, roadWidthAtCameraPlane) {
        const pCamera = {
            x: (p.x || 0) - cameraXOffset,
            y: (p.y || 0) - cameraY,
            z: (p.z || 0) - cameraZ
        };

        // Avoid division by zero or very small z values (which would cause extreme scaling)
        const effectiveZ = pCamera.z <= 0 ? 0.0001 : pCamera.z;
        const scale = cameraDepth / effectiveZ;

        const pScreen = {
            x: Math.round((gameWidth / 2) + (scale * pCamera.x * gameWidth / 2)),
            y: Math.round((gameHeight / 2) - (scale * pCamera.y * gameHeight / 2)),
            // roadWidthAtCameraPlane is the desired visual width of the road if it were flat at the cameraDepth distance
            // We scale this 'width' by the same perspective scale.
            w: Math.round(scale * roadWidthAtCameraPlane * gameWidth / 2)
        };
        return pScreen;
    }

    drawSegment(segment) {
        const camX = 0; // Player is always at X=0 relative to track center

        // Project front and back points of the segment
        // For the road itself, p.x is 0 as we are projecting the center line of the road.
        // The 'w' property of the projection will give us the scaled half-width of the road.
        const p1 = Track.project({ z: segment.z1 }, camX, this.cameraHeight, this.positionZ, this.cameraDepth, this.gameWidth, this.gameHeight, this.roadWidth);
        const p2 = Track.project({ z: segment.z2 }, camX, this.cameraHeight, this.positionZ, this.cameraDepth, this.gameWidth, this.gameHeight, this.roadWidth);

        // Draw Grass (spanning the entire width of the screen for this segment's y range)
        this.ctx.fillStyle = this.colors.grass;
        this.ctx.fillRect(0, p2.y, this.gameWidth, p1.y - p2.y);

        // Draw Road (as a trapezoid)
        this.ctx.fillStyle = segment.color;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x - p1.w, p1.y); // Front-left
        this.ctx.lineTo(p1.x + p1.w, p1.y); // Front-right
        this.ctx.lineTo(p2.x + p2.w, p2.y); // Back-right
        this.ctx.lineTo(p2.x - p2.w, p2.y); // Back-left
        this.ctx.closePath();
        this.ctx.fill();

        // Draw Rumble Strips (as smaller trapezoids)
        const rumbleStripWidthRatio = 0.1; // Rumble strip is 10% of a lane's width
        const rumbleVisualWidth = this.laneWidth * rumbleStripWidthRatio;
        
        // Project the rumble strip widths. The 'roadWidthAtCameraPlane' for this projection is just the rumble strip's own width.
        const p1Rumble = Track.project({ z: segment.z1 }, camX, this.cameraHeight, this.positionZ, this.cameraDepth, this.gameWidth, this.gameHeight, rumbleVisualWidth);
        const p2Rumble = Track.project({ z: segment.z2 }, camX, this.cameraHeight, this.positionZ, this.cameraDepth, this.gameWidth, this.gameHeight, rumbleVisualWidth);

        this.ctx.fillStyle = this.getSegmentRumbleColor(segment.index);

        // Left Rumble Strip
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x - p1.w, p1.y); // Outer edge, same as road
        this.ctx.lineTo(p1.x - p1.w + p1Rumble.w, p1.y); // Inner edge (road_edge + rumble_width)
        this.ctx.lineTo(p2.x - p2.w + p2Rumble.w, p2.y); // Inner edge at back
        this.ctx.lineTo(p2.x - p2.w, p2.y); // Outer edge at back
        this.ctx.closePath();
        this.ctx.fill();

        // Right Rumble Strip
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x + p1.w, p1.y); // Outer edge
        this.ctx.lineTo(p1.x + p1.w - p1Rumble.w, p1.y); // Inner edge
        this.ctx.lineTo(p2.x + p2.w - p2Rumble.w, p2.y); // Inner edge at back
        this.ctx.lineTo(p2.x + p2.w, p2.y); // Outer edge at back
        this.ctx.closePath();
        this.ctx.fill();
    }

    update(deltaTime) {
        this.positionZ += this.speed * deltaTime;

        // Recycle segments when they move behind the camera
        while (this.positionZ >= this.segments[0].z2) { // If current Z has passed the back of the first segment
            this.positionZ -= this.segmentLength; // Effectively move camera back by one segment length
            
            const oldSegment = this.segments.shift(); // Remove from front
            const lastSegment = this.segments[this.segments.length - 1];
            
            // Add new segment to the end
            const newIndex = lastSegment.index + 1;
            this.segments.push({
                index: newIndex,
                z1: lastSegment.z2,
                z2: lastSegment.z2 + this.segmentLength,
                color: this.getSegmentRoadColor(newIndex)
            });
        }
    }

    draw() {
        // Iterate from back to front to ensure correct layering
        for (let i = this.segments.length - 1; i >= 0; i--) {
            this.drawSegment(this.segments[i]);
        }
    }
}

export default Track;
