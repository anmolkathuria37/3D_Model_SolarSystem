  
    const canvas = document.getElementById('solarCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 80, 200);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    const pointLight = new THREE.PointLight(0xffffff, 1.2);
    scene.add(ambientLight);
    scene.add(pointLight);

    const sunGeo = new THREE.SphereGeometry(10, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    const planetData = [
      { name: 'Mercury', color: 0xaaaaaa, size: 1, dist: 15, speed: 0.04 },
      { name: 'Venus', color: 0xffcc99, size: 2, dist: 22, speed: 0.015 },
      { name: 'Earth', color: 0x3366ff, size: 2.5, dist: 30, speed: 0.01 },
      { name: 'Mars', color: 0xff3300, size: 2, dist: 38, speed: 0.008 },
      { name: 'Jupiter', color: 0xffa500, size: 5, dist: 50, speed: 0.002 },
      { name: 'Saturn', color: 0xffe4b5, size: 4.5, dist: 65, speed: 0.001 },
      { name: 'Uranus', color: 0x00ffff, size: 3.5, dist: 78, speed: 0.0008 },
      { name: 'Neptune', color: 0x0000ff, size: 3.5, dist: 90, speed: 0.0005 }
    ];

    const planets = [];
    const sliders = document.getElementById('sliders');

    planetData.forEach((data, i) => {
      const geo = new THREE.SphereGeometry(data.size, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ color: data.color });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      planets.push({ ...data, mesh, angle: Math.random() * Math.PI * 2 });

      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <label>${data.name}: <span id="val-${i}">${data.speed.toFixed(4)}</span></label>
        <input type="range" min="0.0001" max="0.05" step="0.0001" value="${data.speed}" />
      `;
      const slider = wrapper.querySelector('input');
      slider.addEventListener('input', e => {
        planetData[i].speed = parseFloat(e.target.value);
        document.getElementById(`val-${i}`).textContent = e.target.value;
      });
      sliders.appendChild(wrapper);
    });

    function createStars(count = 1000) {
      const starGeo = new THREE.BufferGeometry();
      const positions = [];
      for (let i = 0; i < count; i++) {
        positions.push(
          (Math.random() - 0.5) * 2000,
          (Math.random() - 0.5) * 2000,
          (Math.random() - 0.5) * 2000
        );
      }
      starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xffffff });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);
    }
    createStars();

    let isPaused = false;
    document.getElementById('toggleBtn').addEventListener('click', function () {
      isPaused = !isPaused;
      this.textContent = isPaused ? 'Resume' : 'Pause';
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const labelDiv = document.createElement('div');
    labelDiv.style.position = 'absolute';
    labelDiv.style.color = 'white';
    labelDiv.style.background = 'rgba(0,0,0,0.6)';
    labelDiv.style.padding = '4px 8px';
    labelDiv.style.borderRadius = '5px';
    labelDiv.style.display = 'none';
    labelDiv.style.pointerEvents = 'none';
    labelDiv.style.fontSize = '12px';
    document.body.appendChild(labelDiv);

    window.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

      if (intersects.length > 0) {
        const planet = planets.find(p => p.mesh === intersects[0].object);
        labelDiv.style.left = `${event.clientX + 10}px`;
        labelDiv.style.top = `${event.clientY + 10}px`;
        labelDiv.textContent = planet.name;
        labelDiv.style.display = 'block';
      } else {
        labelDiv.style.display = 'none';
      }
    });

    window.addEventListener('click', (event) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

      if (intersects.length > 0) {
        const targetPlanet = intersects[0].object.position;
        new TWEEN.Tween(camera.position)
          .to({
            x: targetPlanet.x * 1.5,
            y: targetPlanet.y + 10,
            z: targetPlanet.z * 1.5
          }, 1000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();

        new TWEEN.Tween({ x: 0, y: 0, z: 0 })
          .to({
            x: targetPlanet.x,
            y: targetPlanet.y,
            z: targetPlanet.z
          }, 1000)
          .onUpdate(function (obj) {
            camera.lookAt(new THREE.Vector3(obj.x, obj.y, obj.z));
          })
          .start();
      }
    });

    function animate(time) {
      requestAnimationFrame(animate);
      if (!isPaused) {
        planets.forEach(planet => {
          planet.angle += planet.speed;
          planet.mesh.position.set(
            Math.cos(planet.angle) * planet.dist,
            0,
            Math.sin(planet.angle) * planet.dist
          );
        });
      }
      TWEEN.update();
      renderer.render(scene, camera);
    }

    animate();
  