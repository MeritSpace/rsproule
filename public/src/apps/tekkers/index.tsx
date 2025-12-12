import { useEffect, useRef } from 'react'

export default function Tekkers() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<{
    cleanup: () => void
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const container = containerRef.current
    const width = window.innerWidth
    const height = window.innerHeight

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
      camera.position.set(0, 8, 15)
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

      // Game state
      let score = 0
      let highScore = parseInt(localStorage.getItem('tekkers-highscore') || '0')
      let gameOver = false
      let gameStarted = false

      // Physics
      const gravity = -20
      const bounceFactor = 0.85
      const spinFactor = 5

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

      // Mouse tracking - X and Z on the horizontal plane
      let mouseX = 0
      let mouseZ = 0
      const handleMouseMove = (e: MouseEvent) => {
        mouseX = ((e.clientX / width) - 0.5) * 20
        // Map vertical mouse position to Z-axis (forward/back)
        // Top of screen = far (negative Z), bottom = near (positive Z)
        mouseZ = ((e.clientY / height) - 0.5) * 12
      }
      window.addEventListener('mousemove', handleMouseMove)

      // Touch support
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        mouseX = ((e.touches[0].clientX / width) - 0.5) * 20
        mouseZ = ((e.touches[0].clientY / height) - 0.5) * 12
      }
      window.addEventListener('touchmove', handleTouchMove, { passive: false })

      // Click to start/restart
      const handleClick = () => {
        if (!gameStarted || gameOver) {
          resetCube()
        }
      }
      window.addEventListener('click', handleClick)
      window.addEventListener('touchstart', handleClick)

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
        if (!gameStarted) {
          ui.innerHTML = `
            <div style="font-size: 48px; font-weight: bold; text-shadow: 0 0 20px rgba(0,255,136,0.5);">TEKKERS</div>
            <div style="font-size: 18px; margin-top: 10px; opacity: 0.8;">3D Cube Juggling</div>
            <div style="font-size: 24px; margin-top: 30px; animation: pulse 1.5s infinite;">Click to Start</div>
            <div style="font-size: 14px; margin-top: 20px; opacity: 0.6;">Move mouse to control paddle (X and depth)</div>
            ${highScore > 0 ? `<div style="font-size: 16px; margin-top: 10px; color: #ffd700;">Best: ${highScore}</div>` : ''}
            <style>@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }</style>
          `
        } else if (gameOver) {
          ui.innerHTML = `
            <div style="font-size: 36px; color: #ff6b6b; font-weight: bold;">GAME OVER</div>
            <div style="font-size: 64px; margin-top: 10px; font-weight: bold;">${score}</div>
            <div style="font-size: 18px; opacity: 0.8;">bounces</div>
            ${score >= highScore && score > 0 ? '<div style="font-size: 20px; color: #ffd700; margin-top: 10px;">NEW HIGH SCORE!</div>' : ''}
            <div style="font-size: 14px; margin-top: 10px; opacity: 0.6;">Best: ${highScore}</div>
            <div style="font-size: 20px; margin-top: 20px; animation: pulse 1.5s infinite;">Click to Retry</div>
            <style>@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }</style>
          `
        } else {
          ui.innerHTML = `
            <div style="font-size: 48px; font-weight: bold; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${score}</div>
            <div style="font-size: 14px; opacity: 0.6;">Best: ${highScore}</div>
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
        paddle.position.x += (mouseX - paddle.position.x) * 0.15
        paddle.position.z += (mouseZ - paddle.position.z) * 0.15

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
            velocity.y = Math.abs(velocity.y) * bounceFactor + 8

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
        const w = window.innerWidth
        const h = window.innerHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', handleResize)

      // Cleanup function
      gameRef.current = {
        cleanup: () => {
          cancelAnimationFrame(animationId)
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('touchmove', handleTouchMove)
          window.removeEventListener('click', handleClick)
          window.removeEventListener('touchstart', handleClick)
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
        cursor: 'none'
      }}
    />
  )
}
