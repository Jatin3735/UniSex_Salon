/**
 * Studio-style three-point lighting tuned for polished metal: a warm key,
 * a cool champagne rim to catch the blade edges, and a soft fill so the
 * shadow side never goes fully black. The Environment (in the scene) does
 * most of the reflective work; these lights add directional sparkle.
 */
export default function SceneLighting({ quality = 2 }) {
  return (
    <>
      <ambientLight intensity={0.25} />

      {/* Key — warm, upper right */}
      <directionalLight
        position={[5, 6, 4]}
        intensity={2.2}
        color="#fff4e0"
        castShadow={quality > 1}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Champagne rim — lower left, rakes the blade edges */}
      <directionalLight position={[-6, -2, 2]} intensity={1.4} color="#c9a15e" />

      {/* Cool fill from behind for separation */}
      <directionalLight position={[0, 2, -6]} intensity={0.9} color="#8fa3c9" />

      {/* Tight specular pop */}
      <pointLight position={[2, -3, 5]} intensity={12} color="#ffffff" distance={20} decay={2} />
    </>
  );
}
