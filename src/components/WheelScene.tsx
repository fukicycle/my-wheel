import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWheelStore } from '../store/useWheelStore';
import { RIM_PRESETS } from '../lib/physicsEngine';

// Inside Canvas component to access useFrame
const WheelModel: React.FC = () => {
  const { input, output } = useWheelStore();
  const rimPreset = RIM_PRESETS[input.rimPresetId];

  const wheelGroupRef = useRef<THREE.Group>(null);

  const isFront = input.hubType === 'front';

  // Dynamic asymmetric hub specs from input
  const dsFlangeRadius = (input.dsPcdMm / 2) / 1000;   // DS PCD radius (e.g. 0.029m)
  const ndsFlangeRadius = (input.ndsPcdMm / 2) / 1000; // NDS PCD radius (e.g. 0.022m)
  
  const dsOffset = input.dsOffsetMm / 1000;     // e.g. +0.019m (Drive-Side)
  const ndsOffset = input.ndsOffsetMm / 1000;   // e.g. -0.037m (Non-Drive-Side)
  
  // Real O.L.D. Axle End Boundaries based on cycling engineering standards
  const axleEndDS = isFront
    ? 0.050 // Front O.L.D. is strictly 100mm (50mm right offset)
    : (input.isDiscBrake ? 0.071 : 0.065); // Rear O.L.D. is 142mm (Disc) or 130mm (Rim)
    
  const axleEndNds = isFront
    ? 0.050
    : (input.isDiscBrake ? 0.071 : 0.065);

  // Dynamic Rim Radius (ERD / Spoke Nipple Bed radius) based on selected Rim Preset's depth (height)
  // Standard 700c tire bed outer radius is 311mm (0.311m). Nipple bed radius is 311mm - depth + 2mm.
  const rimRadius = (311 - rimPreset.depth + 2) / 1000; // e.g. 24mm depth -> 0.289m, 50mm depth -> 0.263m
  
  // Dynamic Rim Visual geometry metrics:
  // We keep the outer edge at a constant standard 700c size (0.311m), and expand the rim thickness (height) inward
  const rimOuterRadius = 0.311;
  const torusRadius = (rimOuterRadius + rimRadius) / 2; // Center radius of the rim torus
  const rimVisualDepth = (rimOuterRadius - rimRadius) / 2; // Tube radius representing the rim height (depth)

  // 1. Calculate static rim outline points (perfect circle for CAD aesthetics, removing visual deformations as requested)
  const rimPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 120; // smooth circle segments
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * rimRadius,
        Math.sin(angle) * rimRadius,
        0 // No Z-axis lateral warping deformation
      ));
    }
    return points;
  }, []);

  // Generate spoke assignments to calculate perfectly even hub flange hole positions
  const spokeAssignments = useMemo(() => {
    let dsIndex = 0;
    let ndsIndex = 0;
    const dsCount = output.spokes.filter(s => s.isDriveSide).length;
    const ndsCount = output.spokes.filter(s => !s.isDriveSide).length;

    return output.spokes.map((spoke) => {
      let indexOnFlange = 0;
      let totalOnFlange = 0;
      if (spoke.isDriveSide) {
        indexOnFlange = dsIndex;
        totalOnFlange = dsCount;
        dsIndex++;
      } else {
        indexOnFlange = ndsIndex;
        totalOnFlange = ndsCount;
        ndsIndex++;
      }

      return {
        ...spoke,
        indexOnFlange,
        totalOnFlange,
      };
    });
  }, [output.spokes]);

  // Dynamic 3D Lacing Engine: Connects strictly evenly-spaced hub holes to evenly-spaced rim holes,
  // crossing in both directions (Leading/Trailing) for realistic tangent wheel lacing!
  const lacing = useMemo(() => {
    const dsSpokes = spokeAssignments.filter(s => s.isDriveSide);
    const ndsSpokes = spokeAssignments.filter(s => !s.isDriveSide);

    const dsCount = dsSpokes.length;
    const ndsCount = ndsSpokes.length;

    // Rim hole indices assigned to DS and NDS
    const dsRimIndices = dsSpokes.map(s => s.id);
    const ndsRimIndices = ndsSpokes.map(s => s.id);

    const dsCross = input.dsCrossCount;
    const ndsCross = input.ndsCrossCount;

    return spokeAssignments.map((spoke) => {
      const isDriveSide = spoke.isDriveSide;
      const crossCount = isDriveSide ? dsCross : ndsCross;
      const N_side = isDriveSide ? dsCount : ndsCount;
      const rimIndices = isDriveSide ? dsRimIndices : ndsRimIndices;

      // Hub hole index on this flange
      const k = spoke.indexOnFlange;
      
      // Determine strictly alternating Leading/Trailing spokes on each hub flange
      const isLeading = k % 2 === 0;

      // Connect hub hole 'k' to rim hole 'rimIdx' with cross shifting (both directions!)
      let rimIdx = spoke.id;
      if (crossCount > 0) {
        if (isLeading) {
          rimIdx = rimIndices[(k + crossCount) % N_side];
        } else {
          rimIdx = rimIndices[(k - crossCount + N_side) % N_side];
        }
      }

      // 1. Hub flange hole position (strictly evenly-spaced!)
      const flangeRadius = isDriveSide ? dsFlangeRadius : ndsFlangeRadius;
      
      // We add a tiny interleave rotation (Math.PI / N_side) to offset left and right hub holes
      const hubAngle = (k / N_side) * 2 * Math.PI + (isDriveSide ? 0 : Math.PI / N_side);
      const hubX = Math.cos(hubAngle) * (flangeRadius * 0.9);
      const hubY = Math.sin(hubAngle) * (flangeRadius * 0.9);
      const hubZ = isDriveSide ? dsOffset : -ndsOffset;

      // 2. Rim connection position (strictly evenly-spaced!)
      const rimAngle = (rimIdx / input.spokeCount) * 2 * Math.PI;

      // 常に完璧な正円形状を維持（変形仕様の排除）
      const rimX = Math.cos(rimAngle) * rimRadius;
      const rimY = Math.sin(rimAngle) * rimRadius;
      const rimZ = 0; // 横方向の歪みなし

      return {
        ...spoke,
        isLeading,
        hubX,
        hubY,
        hubZ,
        rimX,
        rimY,
        rimZ,
        hubAngle, // Expose for rendering individual spoke entry holes!
      };
    });
  }, [spokeAssignments, dsFlangeRadius, ndsFlangeRadius, dsOffset, ndsOffset, input.dsCrossCount, input.ndsCrossCount, input.spokeCount, rimRadius]);

  // Spin the wheel smoothly based on cadence and pedaling power (without un-physical vibration)
  useFrame((state) => {
    if (wheelGroupRef.current) {
      const speed = 9.42; // assume default 90 RPM for constant rotation speed
      
      if (input.powerWatts > 0) {
        wheelGroupRef.current.rotation.z -= speed * state.clock.getDelta() * 0.15;
      }
    }
  });

  return (
    <group>
      {/* ──────────────────────────────────────────────────────────────── */}
      {/* CAD DIMENSION OVERLAYS & BLUEPRINT HELPER LINES */}
      {/* ──────────────────────────────────────────────────────────────── */}

      {/* Centerline vertical dashed plane helper */}
      <Line
        points={[new THREE.Vector3(0, -0.15, 0), new THREE.Vector3(0, 0.15, 0)]}
        color="#334155"
        lineWidth={0.8}
        dashed
        dashSize={0.005}
        gapSize={0.003}
      />

      {/* OFFSET DIMENSIONS: Projected downwards below hub area for absolute legibility */}
      
      {/* Vertical Extension Line from Center hub down */}
      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.09, 0)]}
        color="#475569"
        lineWidth={1.0}
      />
      {/* Vertical Extension Line from NDS Flange (Left) down */}
      <Line
        points={[new THREE.Vector3(0, 0, -ndsOffset), new THREE.Vector3(0, -0.09, -ndsOffset)]}
        color="#475569"
        lineWidth={1.0}
      />
      {/* Vertical Extension Line from DS Flange (Right) down */}
      <Line
        points={[new THREE.Vector3(0, 0, dsOffset), new THREE.Vector3(0, -0.09, dsOffset)]}
        color="#475569"
        lineWidth={1.0}
      />

      {/* Dimension Line: NDS Center-to-Flange */}
      <Line
        points={[new THREE.Vector3(0, -0.08, 0), new THREE.Vector3(0, -0.08, -ndsOffset)]}
        color="#1e293b"
        lineWidth={2}
      />
      {/* Small tick mark on Left */}
      <Line points={[new THREE.Vector3(0, -0.076, -ndsOffset), new THREE.Vector3(0, -0.084, -ndsOffset)]} color="#1e293b" lineWidth={2} />
      <Html position={[0.025, -0.09, -ndsOffset / 2]} center distanceFactor={1.2}>
        <div className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-cyan-400 rounded shadow-md select-none whitespace-nowrap pointer-events-none">
          L_Offset: {input.ndsOffsetMm}mm
        </div>
      </Html>

      {/* Dimension Line: DS Center-to-Flange */}
      <Line
        points={[new THREE.Vector3(0, -0.08, 0), new THREE.Vector3(0, -0.08, dsOffset)]}
        color="#1e293b"
        lineWidth={2}
      />
      {/* Small tick mark on Right */}
      <Line points={[new THREE.Vector3(0, -0.076, dsOffset), new THREE.Vector3(0, -0.084, dsOffset)]} color="#1e293b" lineWidth={2} />
      <Html position={[0.025, -0.09, dsOffset / 2]} center distanceFactor={1.2}>
        <div className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-cyan-400 rounded shadow-md select-none whitespace-nowrap pointer-events-none">
          R_Offset: {input.dsOffsetMm}mm
        </div>
      </Html>


      {/* PCD DIMENSIONS: Projected upwards for absolute clarity */}

      {/* NDS PCD Leader Line & Label */}
      <Line
        points={[new THREE.Vector3(0, ndsFlangeRadius, -ndsOffset), new THREE.Vector3(0, ndsFlangeRadius + 0.04, -ndsOffset)]}
        color="#1e293b"
        lineWidth={1.2}
      />
      <Line
        points={Array.from({ length: 33 }).map((_, idx) => {
          const a = (idx / 32) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * ndsFlangeRadius, Math.sin(a) * ndsFlangeRadius, -ndsOffset);
        })}
        color="#0284c7"
        lineWidth={1.0}
        dashed
        dashSize={0.004}
        gapSize={0.002}
      />
      <Html position={[0, ndsFlangeRadius + 0.045, -ndsOffset]} center distanceFactor={1.2}>
        <div className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-sky-400 rounded shadow-md select-none whitespace-nowrap pointer-events-none">
          L_PCD: {input.ndsPcdMm}mm
        </div>
      </Html>

      {/* DS PCD Leader Line & Label */}
      <Line
        points={[new THREE.Vector3(0, dsFlangeRadius, dsOffset), new THREE.Vector3(0, dsFlangeRadius + 0.04, dsOffset)]}
        color="#1e293b"
        lineWidth={1.2}
      />
      <Line
        points={Array.from({ length: 33 }).map((_, idx) => {
          const a = (idx / 32) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * dsFlangeRadius, Math.sin(a) * dsFlangeRadius, dsOffset);
        })}
        color="#0284c7"
        lineWidth={1.0}
        dashed
        dashSize={0.004}
        gapSize={0.002}
      />
      <Html position={[0, dsFlangeRadius + 0.045, dsOffset]} center distanceFactor={1.2}>
        <div className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-sky-400 rounded shadow-md select-none whitespace-nowrap pointer-events-none">
          R_PCD: {input.dsPcdMm}mm
        </div>
      </Html>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* FORCE VECTOR ARROWS */}
      {/* ──────────────────────────────────────────────────────────────── */}
      
      {/* 1. Gravity Load Arrow (Red) pushing down on Hub */}
      {input.riderWeightKg > 0 && (
        <group position={[0, ndsFlangeRadius + 0.05, 0.08]}>
          <mesh>
            <cylinderGeometry args={[0.004, 0.004, 0.08, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, -0.04, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.01, 0.02, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {/* 2. Ground Reaction Force (Cyan) pushing up at the bottom */}
      {input.riderWeightKg > 0 && (
        <group position={[0, -rimRadius + 0.04, 0.08]}>
          <mesh>
            <cylinderGeometry args={[0.004, 0.004, 0.06, 8]} />
            <meshBasicMaterial color="#0891b2" />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <coneGeometry args={[0.01, 0.02, 8]} />
            <meshBasicMaterial color="#0891b2" />
          </mesh>
        </group>
      )}

      {/* 3. Torque Arc (Orange) around Hub when pedaling */}
      {input.powerWatts > 0 && !isFront && (
        <group position={[0, 0, dsOffset + 0.03]} rotation={[0, 0, -Math.PI / 4]}>
          <mesh>
            <ringGeometry args={[dsFlangeRadius + 0.015, dsFlangeRadius + 0.025, 32, 1, 0, Math.PI * 1.2]} />
            <meshBasicMaterial color="#ea580c" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
          <mesh position={[dsFlangeRadius + 0.02, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.012, 0.02, 8]} />
            <meshBasicMaterial color="#ea580c" />
          </mesh>
        </group>
      )}

      {/* 4. Traction Drive Arrow (Green) at contact patch pointing forward */}
      {input.powerWatts > 0 && !isFront && (
        <group position={[0.05, -rimRadius, 0.08]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.004, 0.004, 0.08, 8]} />
            <meshBasicMaterial color="#16a34a" />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <coneGeometry args={[0.01, 0.02, 8]} />
            <meshBasicMaterial color="#16a34a" />
          </mesh>
        </group>
      )}

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* MAIN WHEEL ASSEMBLY (HIGH FIDELITY ANATOMICAL HUB CODES) */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <group ref={wheelGroupRef}>
        {/* Hub Axle Cylinder (Internal spindle shaft matching strict O.L.D. dimensions) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, axleEndDS + axleEndNds - 0.002, 32]} />
          <meshStandardMaterial color="#71717a" metalness={0.98} roughness={0.1} /> {/* Polished steel spindle shaft */}
        </mesh>

        {/* Axle End Caps (Chrome detailed end stops matching 100mm front / 130mm rim rear / 142mm disc rear OLD) */}
        <mesh position={[0, 0, axleEndDS]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.004, 32]} />
          <meshStandardMaterial color="#f4f4f5" metalness={0.98} roughness={0.05} />
        </mesh>
        <mesh position={[0, 0, -axleEndNds]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.004, 32]} />
          <meshStandardMaterial color="#f4f4f5" metalness={0.98} roughness={0.05} />
        </mesh>

        {/* Central Hub Shell Hourglass Sculpt (Precisely CAD-mapped for flawless organic curves with zero gaps or steps!) */}
        {/* Automatically adapts to asymmetric dsOffset and ndsOffset values with perfect continuous curves */}
        <group position={[0, 0, 0]}>
          {/* Middle uniform section (12mm sleek central spindle body, mapped around the asymmetric center) */}
          <mesh position={[0, 0, (dsOffset - ndsOffset) * 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.013, 0.013, (dsOffset + ndsOffset) * 0.4, 32]} />
            <meshStandardMaterial color="#27272a" metalness={0.92} roughness={0.12} /> {/* Refined CNC machined titanium gray */}
          </mesh>
          {/* Left-to-Center taper (from Left flange base smoothly shrinking down to meet the 12mm center body) */}
          <mesh position={[0, 0, -ndsOffset * 0.7]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[ndsFlangeRadius * 0.78, 0.013, ndsOffset * 0.6, 32]} />
            <meshStandardMaterial color="#27272a" metalness={0.92} roughness={0.12} />
          </mesh>
          {/* Center-to-Right taper (from 12mm center body smoothly expanding out to meet the Right flange base) */}
          <mesh position={[0, 0, dsOffset * 0.7]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.013, dsFlangeRadius * 0.78, dsOffset * 0.6, 32]} />
            <meshStandardMaterial color="#27272a" metalness={0.92} roughness={0.12} />
          </mesh>
        </group>

        {/* Left Flange (Non-Drive Side) with dark PCD drilling groove */}
        <group position={[0, 0, -ndsOffset]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[ndsFlangeRadius, ndsFlangeRadius, 0.0035, 32]} />
            <meshStandardMaterial color="#27272a" metalness={0.92} roughness={0.12} />
          </mesh>
          {/* PCD engraving ring representing the drilling path */}
          <mesh position={[0, 0, -0.0018]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ndsFlangeRadius * 0.9, 0.0005, 8, 32]} />
            <meshBasicMaterial color="#09090b" />
          </mesh>
        </group>

        {/* Right Flange (Drive Side) with dark PCD drilling groove */}
        <group position={[0, 0, dsOffset]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[dsFlangeRadius, dsFlangeRadius, 0.0035, 32]} />
            <meshStandardMaterial color="#27272a" metalness={0.92} roughness={0.12} />
          </mesh>
          {/* PCD engraving ring */}
          <mesh position={[0, 0, 0.0018]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[dsFlangeRadius * 0.9, 0.0005, 8, 32]} />
            <meshBasicMaterial color="#09090b" />
          </mesh>
        </group>

        {/* REAR ONLY SPECIFIC: Freehub Body, Dust Seals, and Right Axle locknut */}
        {!isFront && (
          <group>
            {/* Freehub dust seal / base collar (bridges the right flange to the red freehub body with zero gaps!) */}
            <mesh position={[0, 0, dsOffset + 0.002]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[dsFlangeRadius * 0.58, dsFlangeRadius * 0.58, 0.004, 32]} />
              <meshStandardMaterial color="#18181b" metalness={0.3} roughness={0.8} /> {/* Dark rubberized lock ring dust seal */}
            </mesh>

            {/* DETAILED: Bare Splined Freehub Body (Locking position and standard length aligned to right flange) */}
            <group position={[0, 0, dsOffset + 0.004 + 0.0185]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh>
                <cylinderGeometry args={[dsFlangeRadius * 0.58, dsFlangeRadius * 0.58, 0.037, 32]} />
                <meshStandardMaterial color="#b91c1c" metalness={0.95} roughness={0.1} /> {/* Refined matte-anodized red freehub! */}
              </mesh>
              {/* 12 spline ribs on freehub outer diameter representing Shimano HG cassette lock splines */}
              {Array.from({ length: 12 }).map((_, rIdx) => {
                const rAng = (rIdx / 12) * Math.PI * 2;
                const ribRadius = dsFlangeRadius * 0.58;
                return (
                  <mesh key={`rib-${rIdx}`} position={[Math.cos(rAng) * ribRadius, 0, Math.sin(rAng) * rAng]} rotation={[0, -rAng, 0]}>
                    <boxGeometry args={[0.0012, 0.037, 0.001]} />
                    <meshStandardMaterial color="#71717a" metalness={0.95} roughness={0.08} />
                  </mesh>
                );
              })}
            </group>

            {/* Right End Axle Locknut (Dynamically fills the gap between freehub body and right dropout) */}
            {(() => {
              const freehubRightEnd = dsOffset + 0.004 + 0.037;
              const locknutLength = Math.max(0.003, axleEndDS - freehubRightEnd);
              const locknutZ = freehubRightEnd + locknutLength / 2;
              return (
                <mesh position={[0, 0, locknutZ]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, locknutLength, 32]} />
                  <meshStandardMaterial color="#d4d4d8" metalness={0.98} roughness={0.06} /> {/* Chrome locknut end cap */}
                </mesh>
              );
            })()}
          </group>
        )}

        {/* LEFT SIDE DETAILS: Left axle locknut (Fills the gap between NDS flange/rotor and left dropout) */}
        {(() => {
          const leftAttachmentZ = -ndsOffset - (input.isDiscBrake ? 0.014 : 0.004);
          const leftLocknutLength = Math.max(0.003, axleEndNds + leftAttachmentZ);
          const leftLocknutZ = leftAttachmentZ - leftLocknutLength / 2;
          return (
            <mesh position={[0, 0, leftLocknutZ]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, leftLocknutLength, 32]} />
              <meshStandardMaterial color={input.isDiscBrake ? "#27272a" : "#d4d4d8"} metalness={0.95} roughness={0.1} />
            </mesh>
          );
        })()}

        {/* DETAILED: Shimano Center Lock Spline body on Non-Drive Side (Left) */}
        {input.isDiscBrake && (
          <group position={[0, 0, -ndsOffset - 0.008]} rotation={[Math.PI / 2, 0, 0]}>
            {/* Center Lock splined cylinder base */}
            <mesh>
              <cylinderGeometry args={[ndsFlangeRadius * 0.55, ndsFlangeRadius * 0.55, 0.008, 32]} />
              <meshStandardMaterial color="#52525b" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Spline ridges */}
            {Array.from({ length: 12 }).map((_, clIdx) => {
              const clAng = (clIdx / 12) * Math.PI * 2;
              const clRad = ndsFlangeRadius * 0.55;
              return (
                <mesh key={`cl-${clIdx}`} position={[Math.cos(clAng) * clRad, 0, Math.sin(clAng) * clRad]} rotation={[0, -clAng, 0]}>
                  <boxGeometry args={[0.0008, 0.008, 0.0008]} />
                  <meshStandardMaterial color="#71717a" metalness={0.95} roughness={0.05} />
                </mesh>
              );
            })}
          </group>
        )}

        {/* MECHANICAL DETAILS: Disc Brake Rotor on Non-Drive Side (Only if disc brake is active) */}
        {input.isDiscBrake && (
          <group position={[0, 0, -ndsOffset - 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            {/* 6-Bolt Mount / Center-lock lockring detailed cap */}
            <mesh position={[0, -0.0015, 0]}>
              <cylinderGeometry args={[ndsFlangeRadius * 0.65, ndsFlangeRadius * 0.65, 0.003, 16]} />
              <meshStandardMaterial color="#3f3f46" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Outer polished steel rotor disc */}
            <mesh>
              <ringGeometry args={[ndsFlangeRadius * 1.1, ndsFlangeRadius * 1.5, 32]} />
              <meshStandardMaterial color="#d4d4d8" metalness={0.98} roughness={0.08} side={THREE.DoubleSide} />
            </mesh>
            {/* Rotor cutouts/slits for high mechanical realism! */}
            {Array.from({ length: 8 }).map((_, rIdx) => {
              const rotAng = (rIdx / 8) * Math.PI * 2;
              const rotRad = ndsFlangeRadius * 1.3;
              return (
                <mesh key={`rotor-slit-${rIdx}`} position={[Math.cos(rotAng) * rotRad, 0, Math.sin(rotAng) * rotRad]} rotation={[0, -rotAng, 0]}>
                  <boxGeometry args={[0.003, 0.002, 0.01]} />
                  <meshBasicMaterial color="#18181b" />
                </mesh>
              );
            })}
          </group>
        )}

        {/* Dynamic Deformed Rim Line (Glowing Holographic Outline) */}
        <Line 
          points={rimPoints} 
          color={rimPreset.material === 'carbon' ? '#0891b2' : '#2563eb'} 
          lineWidth={4.0} 
        />

        {/* Solid Rim Mesh - Dynamically morphs thickness (height) depending on carbon 50mm vs shallow alu 24mm! */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[torusRadius, rimVisualDepth, 16, 64]} />
          <meshStandardMaterial 
            color={rimPreset.material === 'carbon' ? '#1e293b' : '#475569'} 
            roughness={rimPreset.material === 'carbon' ? 0.75 : 0.25}
            metalness={rimPreset.material === 'carbon' ? 0.35 : 0.8}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* 3D TIRE (タイヤ) Mesh - Mounted strictly on the outer diameter (0.311m) of the rim */}
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[0.311 + 0.010, 0.011, 12, 64]} />
          <meshStandardMaterial 
            color="#09090b" 
            roughness={0.95} 
            metalness={0.05} 
          />
        </mesh>

        {/* Spoke Flange Drilling Holes (PCD Drilling Holes) */}
        {/* Draw a tiny dark circle on the flange face representing the holes where spokes are threaded! */}
        {lacing.map((spoke) => {
          const holeZ = spoke.isDriveSide ? dsOffset + 0.0031 : -ndsOffset - 0.0031;
          const holeX = Math.cos(spoke.hubAngle) * (spoke.isDriveSide ? dsFlangeRadius * 0.9 : ndsFlangeRadius * 0.9);
          const holeY = Math.sin(spoke.hubAngle) * (spoke.isDriveSide ? dsFlangeRadius * 0.9 : ndsFlangeRadius * 0.9);
          
          return (
            <mesh key={`hole-${spoke.id}`} position={[holeX, holeY, holeZ]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.0014, 0.0014, 0.0006, 8]} />
              <meshBasicMaterial color="#020617" /> {/* Jet black drill holes! */}
            </mesh>
          );
        })}

        {/* Spokes (Perfect Criss-Cross Lacing in Both Directions!) */}
        {lacing.map((spoke) => {
          const points: [number, number, number][] = [
            [spoke.hubX, spoke.hubY, spoke.hubZ],
            [spoke.rimX, spoke.rimY, spoke.rimZ],
          ];

          return (
            <Line 
              key={spoke.id} 
              points={points} 
              color={spoke.colorHex} 
              lineWidth={1.8} 
            />
          );
        })}
      </group>
    </group>
  );
};

export const WheelScene: React.FC = () => {
  return (
    <div className="w-full h-full relative bg-zinc-950 overflow-hidden">
      {/* 3D Canvas with Angled Camera Position for immediate 3D depth and soft studio background */}
      <Canvas
        camera={{ position: [0.38, 0.18, 0.72], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#18181b']} /> {/* Deep Studio Zinc Gray instead of bright blue-gray */}
        
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 0.5]} intensity={0.4} color="#38bdf8" />
        <directionalLight position={[4, 5, 4]} intensity={1.8} castShadow />
        <directionalLight position={[-4, -2, -4]} intensity={0.6} />

        {/* Dynamic Wheel Model */}
        <WheelModel />

        {/* Orbit Controls with absolute 360° spherical rotation */}
        <OrbitControls 
          enableZoom={true} 
          maxDistance={1.6} 
          minDistance={0.30}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />

        {/* Sleek Dark Grid Helper for high visibility contrast */}
        <group position={[0, -0.34, 0]}>
          <Grid 
            position={[0, 0, 0]} 
            args={[3, 3]} 
            cellSize={0.1} 
            cellThickness={0.4} 
            cellColor="#27272a" 
            sectionSize={0.5} 
            sectionThickness={1.0} 
            sectionColor="#3f3f46" 
            fadeDistance={1.5}
            infiniteGrid
          />
        </group>
      </Canvas>

      {/* Sci-Fi Floating HUD overlay - refined glassmorphic styling */}
      <div className="absolute top-4 right-4 bg-zinc-900/70 border border-zinc-800/50 p-2.5 rounded-lg text-[10px] font-mono text-zinc-300 flex flex-col gap-1 pointer-events-none shadow-xl backdrop-blur-md">
        <div className="text-zinc-400 font-bold border-b border-zinc-800/60 pb-1 mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-ping"></span>
          RENDER ENGINE: STUDIO GRAY PERSPECTIVE
        </div>
        <div>CAM COORDS: 360° ACTIVE</div>
        <div>LATERAL WARP: TRUE COORD</div>
        <div>LACING: 1:1 / 2:1 EQUAL DRILL</div>
        <div className="text-zinc-500 mt-1 text-[9px] italic">Drag to view 360° structure</div>
      </div>
    </div>
  );
};
