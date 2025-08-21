# Custom 3D Models Guide for The Living Sketchbook

## Best Sources for Free 3D Models

### 1. **Sketchfab** (Recommended)
- **URL**: https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount
- **Best for**: High-quality character models
- **Formats**: GLTF, GLB, FBX, OBJ
- **How to use**: 
  1. Filter by "Downloadable"
  2. Look for Creative Commons licenses
  3. Download GLTF/GLB format for best web compatibility
- **Pro tip**: Search for "low poly character" for multiplayer-optimized models

### 2. **Quaternius** (Perfect for Multiplayer)
- **URL**: https://quaternius.com/packs.html
- **Best for**: Low-poly characters and creatures
- **License**: CC0 (completely free)
- **Formats**: FBX, OBJ, BLEND
- **Popular packs**:
  - Ultimate Animated Characters
  - Animated Animals
  - RPG Characters

### 3. **Adobe Mixamo** (Animated Characters)
- **URL**: https://www.mixamo.com/#/?page=1&type=Character
- **Best for**: Rigged characters with animations
- **Formats**: FBX, COLLADA
- **Note**: Requires free Adobe account
- **Great for**: Professional-looking animated avatars

### 4. **OpenGameArt**
- **URL**: https://opengameart.org/art-search-advanced?keys=&field_art_type_tid[]=9
- **Best for**: Game-ready assets
- **License**: Various free licenses
- **Formats**: OBJ, BLEND, FBX, DAE

### 5. **Kenney Assets**
- **URL**: https://kenney.nl/assets?q=3D
- **Best for**: Simple, clean characters
- **License**: CC0
- **Formats**: OBJ, FBX, BLEND
- **Perfect for**: Minimalist multiplayer avatars

### 6. **Poly Haven**
- **URL**: https://polyhaven.com/models
- **Best for**: High-quality PBR models
- **License**: CC0
- **Formats**: BLEND, FBX, OBJ

## Quick Setup Instructions

### Adding Custom Models to Your Project

1. **Download Model**
   - Choose GLTF or GLB format when available
   - If using FBX/OBJ, convert to GLTF using Blender or online converters

2. **Add to Project**
   ```bash
   # Place model files in public/models/characters/
   public/
     models/
       characters/
         robot.glb
         ninja.gltf
         warrior.glb
   ```

3. **Use in Code**
   ```typescript
   // In Gallery3D.tsx, replace PlayerAvatar with EnhancedPlayerAvatar
   import { EnhancedPlayerAvatar } from './CustomModelLoader';
   
   // Render with custom model
   <EnhancedPlayerAvatar
     position={player.position}
     color={player.color}
     name={player.name}
     customModelUrl="/models/characters/robot.glb"
   />
   ```

## Recommended Models for Multiplayer

### Low-Poly Characters (Best Performance)
- **Polygon Count**: Under 5,000 triangles
- **File Size**: Under 1MB
- **Examples**:
  - Simple humanoid robots
  - Stylized cartoon characters
  - Geometric/abstract avatars

### Search Terms That Work Well
- "low poly character"
- "game ready avatar"
- "rigged character"
- "multiplayer character"
- "stylized human"

## Model Optimization Tips

### For Web Performance
1. **Keep polygon count low** (under 10,000 triangles)
2. **Use GLTF/GLB format** for best compression
3. **Optimize textures** to 512x512 or 1024x1024 max
4. **Remove unnecessary animations** if not needed

### File Format Conversion
If you have FBX or OBJ files, convert them:

**Using Blender (Free)**:
1. Import FBX/OBJ file
2. File → Export → glTF 2.0
3. Choose GLB format for single file

**Online Converters**:
- https://anyconv.com/fbx-to-gltf-converter/
- https://products.groupdocs.app/conversion/fbx-to-gltf

## Implementation in Your Gallery

### Current Setup
The multiplayer system supports:
- 3 preset models (Capsule, Cube Bot, Stick Figure)
- Custom color selection
- Character names

### Adding Custom Models
1. Update `CharacterSelector.tsx` to include custom model upload
2. Store model URLs in localStorage or database
3. Use `EnhancedPlayerAvatar` component for rendering

### Example Custom Model Integration
```typescript
// Add to characterModels in PlayerAvatar.tsx
const customModels = {
  robot: {
    name: 'Robot',
    url: '/models/characters/robot.glb',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1']
  },
  ninja: {
    name: 'Ninja',
    url: '/models/characters/ninja.glb', 
    colors: ['#333333', '#660066', '#006600']
  }
};
```

## Popular Character Styles for Galleries

### Art Gallery Themed
- **Museum Guard**: Professional uniform character
- **Art Student**: Casual, creative character
- **Curator**: Formal, sophisticated character
- **Artist**: Paint-splattered, creative character

### General Purpose
- **Robot/Android**: Futuristic, clean
- **Cartoon Human**: Friendly, approachable  
- **Abstract Avatar**: Geometric, modern
- **Animal Characters**: Fun, unique

## License Considerations

### Safe Licenses for Commercial Use
- **CC0**: No restrictions, completely free
- **CC BY**: Requires attribution
- **CC BY-SA**: Requires attribution and share-alike

### Avoid These Licenses
- **CC BY-NC**: Non-commercial only
- **CC BY-ND**: No derivatives allowed

## Performance Optimization

### For Smooth Multiplayer
- Limit to 20-50 players max per room
- Use Level of Detail (LOD) - simpler models for distant players
- Implement view frustum culling
- Consider using instanced rendering for identical models

### File Size Guidelines
- **Excellent**: Under 100KB
- **Good**: 100KB - 500KB  
- **Acceptable**: 500KB - 1MB
- **Too Large**: Over 1MB (will cause lag)

## Next Steps

1. Choose 3-5 models from recommended sources
2. Convert to GLTF/GLB format if needed
3. Add to `/public/models/characters/` folder
4. Update character selection interface
5. Test with multiple players

The custom model loader is already implemented and ready to use!