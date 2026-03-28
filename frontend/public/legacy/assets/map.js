const COVERAGE_URLS = {
  telia: "https://www.telia.se/support/tackningskarta",
  tele2: "https://www.tele2.se/tackningskarta",
  telenor: "https://www.telenor.se/support/tackningskarta",
  tre: "https://www.tre.se/support/tackningskarta",
  halebop: "https://www.halebop.se/tackningskarta"
};
const mapFrame = document.getElementById("coverageMap");

document.querySelectorAll(".operator-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".operator-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    const op = btn.dataset.operator;
    mapFrame.src = COVERAGE_URLS[op];
  });
});
