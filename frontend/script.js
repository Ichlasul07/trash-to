document.getElementById("reportForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append("lokasi", document.getElementById("lokasi").value);
    formData.append("deskripsi", document.getElementById("deskripsi").value);
    formData.append("foto", document.getElementById("foto").files[0]);
  
    await fetch("http://YOUR_EC2_IP:3000/report", {
      method: "POST",
      body: formData,
    });
  
    alert("Laporan terkirim!");
  });