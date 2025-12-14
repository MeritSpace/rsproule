import { useEffect, useRef } from 'react'

export default function Tekkers() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<{
    cleanup: () => void
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const container = containerRef.current
    let width = window.innerWidth
    let height = window.innerHeight

    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Dynamically load Three.js
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    script.onload = () => initGame()
    document.head.appendChild(script)

    function initGame() {
      const THREE = (window as any).THREE

      // Scene setup
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x1a1a2e)

      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
      camera.position.set(0, 18, 38)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      container.appendChild(renderer.domElement)

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(10, 20, 10)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      scene.add(directionalLight)

      const pointLight = new THREE.PointLight(0x00ffff, 0.5, 50)
      pointLight.position.set(0, 10, 0)
      scene.add(pointLight)

      // Paddle - 2D surface that moves on XZ plane
      const paddleGeometry = new THREE.BoxGeometry(4, 0.3, 4)
      const paddleMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff88,
        emissive: 0x004422,
        shininess: 100
      })
      const paddle = new THREE.Mesh(paddleGeometry, paddleMaterial)
      paddle.position.y = -4
      paddle.receiveShadow = true
      paddle.castShadow = true
      scene.add(paddle)

      // Cube
      const cubeSize = 1
      const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
      const cubeMaterial = new THREE.MeshPhongMaterial({
        color: 0xff6b6b,
        emissive: 0x331111,
        shininess: 80
      })
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
      cube.castShadow = true
      cube.receiveShadow = true
      scene.add(cube)

      // Cube edges for visibility
      const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry)
      const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
      const cubeEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial)
      cube.add(cubeEdges)

      // Floor (for visual reference, cube falls through)
      const floorGeometry = new THREE.PlaneGeometry(30, 30)
      const floorMaterial = new THREE.MeshPhongMaterial({
        color: 0x16213e,
        side: THREE.DoubleSide
      })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -6
      floor.receiveShadow = true
      scene.add(floor)

      // Grid helper
      const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222)
      gridHelper.position.y = -5.99
      scene.add(gridHelper)

      // Glass bounding box
      const boxWidth = 24  // -12 to 12
      const boxDepth = 16  // -8 to 8
      const boxHeight = 20 // floor to ceiling
      const boxBottom = -6
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.15,
        roughness: 0.05,
        metalness: 0.1,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
        envMapIntensity: 1.0
      })

      // Create glass walls
      // Left wall
      const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxDepth, boxHeight),
        glassMaterial
      )
      leftWall.position.set(-boxWidth / 2, boxBottom + boxHeight / 2, 0)
      leftWall.rotation.y = Math.PI / 2
      scene.add(leftWall)

      // Right wall
      const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxDepth, boxHeight),
        glassMaterial
      )
      rightWall.position.set(boxWidth / 2, boxBottom + boxHeight / 2, 0)
      rightWall.rotation.y = -Math.PI / 2
      scene.add(rightWall)

      // Front wall
      const frontWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxWidth, boxHeight),
        glassMaterial
      )
      frontWall.position.set(0, boxBottom + boxHeight / 2, boxDepth / 2)
      frontWall.rotation.y = Math.PI
      scene.add(frontWall)

      // Back wall
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxWidth, boxHeight),
        glassMaterial
      )
      backWall.position.set(0, boxBottom + boxHeight / 2, -boxDepth / 2)
      scene.add(backWall)

      // Top (ceiling)
      const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(boxWidth, boxDepth),
        glassMaterial
      )
      ceiling.position.set(0, boxBottom + boxHeight, 0)
      ceiling.rotation.x = Math.PI / 2
      scene.add(ceiling)

      // Glass box edges for visibility
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.5 })
      const boxEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth))
      const boxWireframe = new THREE.LineSegments(boxEdges, edgeMaterial)
      boxWireframe.position.set(0, boxBottom + boxHeight / 2, 0)
      scene.add(boxWireframe)

      // Game state
      let score = 0
      let highScore = parseInt(localStorage.getItem('tekkers-highscore') || '0')
      let gameOver = false
      let gameStarted = false

      // Physics
      const gravity = -20
      const bounceFactor = 0.5
      const spinFactor = 3

      let velocity = { x: 0, y: 0, z: 0 }
      let angularVelocity = { x: 0, y: 0, z: 0 }

      // Reset cube position
      function resetCube() {
        cube.position.set(0, 5, 0)
        cube.rotation.set(0, 0, 0)
        velocity = { x: (Math.random() - 0.5) * 2, y: 0, z: (Math.random() - 0.5) * 2 }
        angularVelocity = { x: 0, y: 0, z: 0 }
        score = 0
        gameOver = false
        gameStarted = true
        updateUI()
      }

      // Input state - unified for both mouse and touch
      let paddleTargetX = 0
      let paddleTargetZ = 0

      // Track touch start position for relative movement on mobile
      let touchStartX = 0
      let touchStartY = 0
      let paddleStartX = 0
      let paddleStartZ = 0
      let isTouching = false

      // Mouse controls - X from mouse move, Z from mouse wheel
      const handleMouseMove = (e: MouseEvent) => {
        if (isTouchDevice) return
        paddleTargetX = ((e.clientX / window.innerWidth) - 0.5) * 20
      }
      window.addEventListener('mousemove', handleMouseMove)

      // Mouse wheel for Z-axis (forward/backward) - desktop only
      const handleWheel = (e: WheelEvent) => {
        if (isTouchDevice) return
        e.preventDefault()
        paddleTargetZ += e.deltaY * 0.01
        paddleTargetZ = Math.max(-6, Math.min(6, paddleTargetZ))
      }
      window.addEventListener('wheel', handleWheel, { passive: false })

      // Touch controls - relative movement with high sensitivity
      // 20% of screen movement = full paddle range
      // Aspect ratio corrected so movement feels equal in all directions
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        if (e.touches.length === 1 && isTouching) {
          const touchX = e.touches[0].clientX
          const touchY = e.touches[0].clientY

          // Calculate delta from touch start position
          const deltaX = touchX - touchStartX
          const deltaY = touchY - touchStartY

          // High sensitivity: 20% of screen = full range
          // Paddle X range is 20 units (-10 to 10), Paddle Z range is 12 units (-6 to 6)
          const screenSize = Math.min(window.innerWidth, window.innerHeight)
          const sensitivity = 5 // 20% of screen = full range (1/0.2 = 5)

          // Use the smaller screen dimension as reference for both axes
          // This ensures equal physical finger movement = equal paddle movement
          const normalizedDeltaX = (deltaX / screenSize) * sensitivity
          const normalizedDeltaY = (deltaY / screenSize) * sensitivity

          // Apply to paddle position (scaled to paddle range)
          paddleTargetX = paddleStartX + normalizedDeltaX * 20 // Full X range is 20 units
          paddleTargetZ = paddleStartZ + normalizedDeltaY * 12 // Full Z range is 12 units

          // Clamp to paddle bounds
          paddleTargetX = Math.max(-10, Math.min(10, paddleTargetX))
          paddleTargetZ = Math.max(-6, Math.min(6, paddleTargetZ))
        }
      }

      // Track tap timing for distinguishing taps from drags
      let tapStartTime = 0
      let tapStartX = 0
      let tapStartY = 0

      const handleTouchStartCombined = (e: TouchEvent) => {
        // Track for movement
        if (e.touches.length === 1) {
          isTouching = true
          touchStartX = e.touches[0].clientX
          touchStartY = e.touches[0].clientY
          paddleStartX = paddleTargetX
          paddleStartZ = paddleTargetZ
          // Track for tap detection
          tapStartTime = Date.now()
          tapStartX = e.touches[0].clientX
          tapStartY = e.touches[0].clientY
        }
      }

      const handleTouchEndCombined = (e: TouchEvent) => {
        isTouching = false
        // Only trigger tap if it was quick and didn't move much
        const tapDuration = Date.now() - tapStartTime
        if (tapDuration < 300) {
          if (!gameStarted || gameOver) {
            resetCube()
          }
        }
      }

      window.addEventListener('touchstart', handleTouchStartCombined, { passive: true })
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEndCombined, { passive: true })

      // Click to start/restart (desktop only)
      const handleClick = () => {
        if (!gameStarted || gameOver) {
          resetCube()
        }
      }
      window.addEventListener('click', handleClick)

      // UI
      const ui = document.createElement('div')
      ui.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-family: 'Segoe UI', system-ui, sans-serif;
        text-align: center;
        pointer-events: none;
        z-index: 100;
      `
      container.appendChild(ui)

      const updateUI = () => {
        const controlsText = isTouchDevice
          ? 'Touch and drag to move paddle'
          : 'Mouse: left/right | Scroll wheel: forward/back'
        const startText = isTouchDevice ? 'Tap to Start' : 'Click to Start'
        const retryText = isTouchDevice ? 'Tap to Retry' : 'Click to Retry'
        const fontSize = isTouchDevice ? 'clamp(32px, 8vw, 48px)' : '48px'
        const subFontSize = isTouchDevice ? 'clamp(14px, 4vw, 18px)' : '18px'
        const scoreFontSize = isTouchDevice ? 'clamp(36px, 10vw, 64px)' : '64px'

        if (!gameStarted) {
          ui.innerHTML = `
            <div style="font-size: ${fontSize}; font-weight: bold; text-shadow: 0 0 20px rgba(0,255,136,0.5);">TEKKERS</div>
            <div style="font-size: ${subFontSize}; margin-top: 10px; opacity: 0.8;">3D Cube Juggling</div>
            <div style="font-size: clamp(18px, 5vw, 24px); margin-top: 30px; animation: pulse 1.5s infinite;">${startText}</div>
            <div style="font-size: clamp(12px, 3vw, 14px); margin-top: 20px; opacity: 0.6; padding: 0 20px;">${controlsText}</div>
            ${highScore > 0 ? `<div style="font-size: clamp(14px, 3.5vw, 16px); margin-top: 10px; color: #ffd700;">Best: ${highScore}</div>` : ''}
            <style>@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }</style>
          `
        } else if (gameOver) {
          ui.innerHTML = `
            <div style="font-size: clamp(28px, 7vw, 36px); color: #ff6b6b; font-weight: bold;">GAME OVER</div>
            <div style="font-size: ${scoreFontSize}; margin-top: 10px; font-weight: bold;">${score}</div>
            <div style="font-size: ${subFontSize}; opacity: 0.8;">bounces</div>
            ${score >= highScore && score > 0 ? `<div style="font-size: clamp(16px, 4vw, 20px); color: #ffd700; margin-top: 10px;">NEW HIGH SCORE!</div>` : ''}
            <div style="font-size: clamp(12px, 3vw, 14px); margin-top: 10px; opacity: 0.6;">Best: ${highScore}</div>
            <div style="font-size: clamp(16px, 4vw, 20px); margin-top: 20px; animation: pulse 1.5s infinite;">${retryText}</div>
            <style>@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }</style>
          `
        } else {
          ui.innerHTML = `
            <div style="font-size: ${fontSize}; font-weight: bold; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${score}</div>
            <div style="font-size: clamp(12px, 3vw, 14px); opacity: 0.6;">Best: ${highScore}</div>
          `
        }
      }
      updateUI()

      // Particle system for bounce effect
      const particles: THREE.Mesh[] = []
      const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8)
      const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 })

      function createParticles(position: THREE.Vector3) {
        for (let i = 0; i < 15; i++) {
          const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone())
          particle.position.copy(position)
          particle.userData = {
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 10,
              Math.random() * 8,
              (Math.random() - 0.5) * 10
            ),
            life: 1
          }
          scene.add(particle)
          particles.push(particle)
        }
      }

      // Animation loop
      let lastTime = performance.now()
      let animationId: number

      function animate() {
        animationId = requestAnimationFrame(animate)

        const currentTime = performance.now()
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1)
        lastTime = currentTime

        // Smooth paddle movement on 2D horizontal plane (X and Z)
        paddle.position.x += (paddleTargetX - paddle.position.x) * 0.15
        paddle.position.z += (paddleTargetZ - paddle.position.z) * 0.15

        // Clamp paddle position
        paddle.position.x = Math.max(-10, Math.min(10, paddle.position.x))
        paddle.position.z = Math.max(-6, Math.min(6, paddle.position.z))

        if (gameStarted && !gameOver) {
          // Apply gravity
          velocity.y += gravity * deltaTime

          // Update position
          cube.position.x += velocity.x * deltaTime
          cube.position.y += velocity.y * deltaTime
          cube.position.z += velocity.z * deltaTime

          // Update rotation
          cube.rotation.x += angularVelocity.x * deltaTime
          cube.rotation.y += angularVelocity.y * deltaTime
          cube.rotation.z += angularVelocity.z * deltaTime

          // Dampen angular velocity
          angularVelocity.x *= 0.99
          angularVelocity.y *= 0.99
          angularVelocity.z *= 0.99

          // Wall bounces (left/right)
          if (cube.position.x < -12 || cube.position.x > 12) {
            velocity.x *= -0.8
            cube.position.x = Math.max(-12, Math.min(12, cube.position.x))
          }

          // Wall bounces (front/back)
          if (cube.position.z < -8 || cube.position.z > 8) {
            velocity.z *= -0.8
            cube.position.z = Math.max(-8, Math.min(8, cube.position.z))
          }

          // Paddle collision
          const paddleTop = paddle.position.y + 0.15
          const cubeBottom = cube.position.y - cubeSize / 2

          if (
            cubeBottom <= paddleTop &&
            cubeBottom >= paddleTop - 1 &&
            velocity.y < 0 &&
            Math.abs(cube.position.x - paddle.position.x) < 2.5 &&
            Math.abs(cube.position.z - paddle.position.z) < 2.5
          ) {
            // Bounce!
            velocity.y = Math.abs(velocity.y) * bounceFactor + 5

            // Add horizontal velocity based on where it hit the paddle (X and Z)
            const hitOffsetX = (cube.position.x - paddle.position.x) / 2
            const hitOffsetZ = (cube.position.z - paddle.position.z) / 1
            velocity.x += hitOffsetX * 3
            velocity.z += hitOffsetZ * 3

            // Add spin based on both velocity components
            angularVelocity.x = velocity.z * 0.5 + (Math.random() - 0.5) * spinFactor
            angularVelocity.y = (Math.random() - 0.5) * spinFactor
            angularVelocity.z = velocity.x * 0.5

            // Score!
            score++
            if (score > highScore) {
              highScore = score
              localStorage.setItem('tekkers-highscore', highScore.toString())
            }

            // Visual feedback
            createParticles(new THREE.Vector3(cube.position.x, paddleTop, cube.position.z))
            paddleMaterial.emissive.setHex(0x00ff00)
            setTimeout(() => paddleMaterial.emissive.setHex(0x004422), 100)

            updateUI()
          }

          // Game over check
          if (cube.position.y < -8) {
            gameOver = true
            updateUI()
          }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          p.userData.velocity.y -= 20 * deltaTime
          p.position.x += p.userData.velocity.x * deltaTime
          p.position.y += p.userData.velocity.y * deltaTime
          p.position.z += p.userData.velocity.z * deltaTime
          p.userData.life -= deltaTime * 2
          ;(p.material as THREE.MeshBasicMaterial).opacity = p.userData.life

          if (p.userData.life <= 0) {
            scene.remove(p)
            particles.splice(i, 1)
          }
        }

        // Gentle camera sway
        camera.position.x = Math.sin(currentTime * 0.0005) * 0.5

        renderer.render(scene, camera)
      }

      animate()

      // Handle resize
      const handleResize = () => {
        width = window.innerWidth
        height = window.innerHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      }
      window.addEventListener('resize', handleResize)

      // Set initial pixel ratio for mobile
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      // Cleanup function
      gameRef.current = {
        cleanup: () => {
          cancelAnimationFrame(animationId)
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('wheel', handleWheel)
          window.removeEventListener('touchstart', handleTouchStartCombined)
          window.removeEventListener('touchmove', handleTouchMove)
          window.removeEventListener('touchend', handleTouchEndCombined)
          window.removeEventListener('click', handleClick)
          window.removeEventListener('resize', handleResize)
          renderer.dispose()
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement)
          }
          if (container.contains(ui)) {
            container.removeChild(ui)
          }
        }
      }
    }

    return () => {
      gameRef.current?.cleanup()
      gameRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        cursor: 'none',
        touchAction: 'none', // Prevent browser touch behaviors
        userSelect: 'none',  // Prevent text selection
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      } as React.CSSProperties}
    />
  )
}
