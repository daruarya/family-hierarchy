// URL Google Sheet dalam format CSV
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSCrAyIWhxxVfIn9_jcP0hYGwyBDomkJo6vwxKrW3vp2_H1pJ5qev6jZ-0_5BQAO0IS03GHfc7RL14l/pub?gid=58345307&single=true&output=csv';
let fullFamilyData = {}; // Variabel global untuk menyimpan data lengkap

/**
 * Mengambil data CSV dari URL, memprosesnya, dan merender pohon silsilah.
 */
async function fetchAndRenderFamilyTree() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        
        fullFamilyData = parseCsvData(csvText);
        renderFamilyStructure(fullFamilyData);

    } catch (error) {
        console.error("Gagal mengambil data:", error);
        document.getElementById('family-tree-container').innerHTML = '<div class="text-red-500 text-center">Gagal memuat silsilah keluarga. Mohon cek koneksi atau tautan Google Sheet.</div>';
    }
}

/**
 * Mengurai teks CSV menjadi struktur data objek JavaScript.
 * @param {string} csvText - Teks CSV dari Google Sheet.
 * @returns {object} Struktur data keluarga yang diurai.
 */
function parseCsvData(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const familyData = {};
    let currentCouple = null;
    let currentChild = null;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const coupleColIndex = headers.indexOf('Pasangan Awal');
    const childColIndex = headers.indexOf('Anak');
    const menantu1ColIndex = headers.indexOf('Menantu Pertama');
    const statusMenantu1ColIndex = headers.indexOf('Status Menantu Pertama');
    const menantu2ColIndex = headers.indexOf('Menantu Kedua');
    const statusMenantu2ColIndex = headers.indexOf('Status Menantu Kedua');
    const statusAnakColIndex = headers.indexOf('Status Anak');

    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(s => s.replace(/"/g, '').trim());
        const couple = columns[coupleColIndex];
        const child = columns[childColIndex];
        const menantu1 = (menantu1ColIndex !== -1) ? columns[menantu1ColIndex] : '';
        const statusMenantu1 = (statusMenantu1ColIndex !== -1) ? columns[statusMenantu1ColIndex] : '';
        const menantu2 = (menantu2ColIndex !== -1) ? columns[menantu2ColIndex] : '';
        const statusMenantu2 = (statusMenantu2ColIndex !== -1) ? columns[statusMenantu2ColIndex] : '';
        const statusAnak = (statusAnakColIndex !== -1) ? columns[statusAnakColIndex] : '';

        if (couple) {
            currentCouple = couple;
            familyData[currentCouple] = {};
        }
        if (child) {
            currentChild = child;
            familyData[currentCouple][currentChild] = {
                menantu: [],
                statusAnak: statusAnak,
                grandchildren: []
            };
            if (menantu1) {
                familyData[currentCouple][currentChild].menantu.push({ name: menantu1, status: statusMenantu1 });
            }
            if (menantu2) {
                familyData[currentCouple][currentChild].menantu.push({ name: menantu2, status: statusMenantu2 });
            }
        }

        for (let j = Math.max(menantu1ColIndex, statusMenantu2ColIndex, coupleColIndex, childColIndex, statusAnakColIndex) + 1; j < columns.length; j++) {
            const grandchild = columns[j].trim();
            if (grandchild && currentChild) {
                familyData[currentCouple][currentChild].grandchildren.push(grandchild);
            }
        }
    }
    return familyData;
}

/**
 * Merender struktur data keluarga dalam format yang mobile-friendly.
 * @param {object} data - Struktur data keluarga yang difilter.
 */
function renderFamilyStructure(data) {
    const container = document.getElementById('family-tree-container');
    container.innerHTML = '';
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (Object.keys(data).length === 0) {
        container.innerHTML = `
            <div class="not-found-container">
                <span class="material-symbols-outlined text-8xl mb-4 not-found-icon">
                    search_off
                </span>
                <p class="not-found-title">Tidak ada hasil yang ditemukan.</p>
                <p class="not-found-subtitle mt-2">Coba kata kunci lain atau periksa ejaan.</p>
            </div>
        `;
        return;
    }

    for (const couple in data) {
        const cleanCoupleName = couple.replace(/^[IVX]+\s/g, '').replace(/^\d+\.\s*/, '').trim();

        const coupleGroup = document.createElement('div');
        coupleGroup.className = 'couple-group-header';
        coupleGroup.innerHTML = highlightText(cleanCoupleName, searchTerm);
        container.appendChild(coupleGroup);

        const children = Object.keys(data[couple]);
        children.forEach(child => {
            const childData = data[couple][child];
            const cleanChildName = child.replace(/^\d+\.\s*/, '').trim();
            const statusAnak = childData.statusAnak || '';

            // Gabungkan nama menantu dengan status
            const menantuList = childData.menantu.map(m => {
                const menantuNameHighlighted = highlightText(m.name, searchTerm);
                const statusMenantuHighlighted = m.status ? `<span class="text-xs text-gray-500">(${highlightText(m.status, searchTerm)})</span>` : '';
                return `${menantuNameHighlighted} ${statusMenantuHighlighted}`.trim();
            }).filter(m => m !== '').join(', ');

            const childItem = document.createElement('div');
            childItem.className = 'family-item family-item-child';
            childItem.innerHTML = `
                <div class="profile-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                </div>
                <div>
                    <p class="family-name">
                        ${highlightText(cleanChildName, searchTerm)} ${statusAnak ? `<span class="text-xs text-gray-500">(${highlightText(statusAnak, searchTerm)})</span>` : ''}
                    </p>
                    ${menantuList ? `<p class="subtitle">Pasangan: ${menantuList}</p>` : ''}
                </div>
            `;
            container.appendChild(childItem);

            const grandchildren = childData.grandchildren;
            if (grandchildren.length > 0) {
                grandchildren.forEach((grandchild, index) => {
                    const grandchildItem = document.createElement('div');
                    grandchildItem.className = 'family-item family-item-grandchild';
                    
                    const subtitleText = `Cucu ke-${index + 1}`;
                    const cleanGrandchildName = grandchild.replace('*', '').trim();

                    grandchildItem.innerHTML = `
                        <div class="profile-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                        <div>
                            <p class="family-name grandchild-name">${highlightText(cleanGrandchildName, searchTerm)}</p>
                            <p class="subtitle">${subtitleText}</p>
                        </div>
                    `;
                    container.appendChild(grandchildItem);
                });
            }
        });
    }
}

/**
 * Fungsi pembantu untuk highlight teks.
 */
function highlightText(text, searchTerm) {
    if (!searchTerm) {
        return text;
    }
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

/**
 * Mengurai teks CSV menjadi struktur data objek JavaScript.
 * @param {string} csvText - Teks CSV dari Google Sheet.
 * @returns {object} Struktur data keluarga yang diurai.
 */
function parseCsvData(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const familyData = {};
    let currentCouple = null;
    let currentChild = null;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const coupleColIndex = headers.indexOf('Pasangan Awal');
    const childColIndex = headers.indexOf('Anak');
    const menantu1ColIndex = headers.indexOf('Menantu Pertama');
    const statusMenantu1ColIndex = headers.indexOf('Status Menantu Pertama');
    const menantu2ColIndex = headers.indexOf('Menantu Kedua');
    const statusMenantu2ColIndex = headers.indexOf('Status Menantu Kedua');
    const statusAnakColIndex = headers.indexOf('Status Anak');

    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(s => s.replace(/"/g, '').trim());
        const couple = columns[coupleColIndex];
        const child = columns[childColIndex];
        const menantu1 = (menantu1ColIndex !== -1) ? columns[menantu1ColIndex] : '';
        const statusMenantu1 = (statusMenantu1ColIndex !== -1) ? columns[statusMenantu1ColIndex] : '';
        const menantu2 = (menantu2ColIndex !== -1) ? columns[menantu2ColIndex] : '';
        const statusMenantu2 = (statusMenantu2ColIndex !== -1) ? columns[statusMenantu2ColIndex] : '';
        const statusAnak = (statusAnakColIndex !== -1) ? columns[statusAnakColIndex] : '';

        if (couple) {
            currentCouple = couple;
            familyData[currentCouple] = {};
        }
        if (child) {
            currentChild = child;
            familyData[currentCouple][currentChild] = {
                menantu: [],
                statusAnak: statusAnak,
                grandchildren: []
            };
            if (menantu1) {
                familyData[currentCouple][currentChild].menantu.push({ name: menantu1, status: statusMenantu1 });
            }
            if (menantu2) {
                familyData[currentCouple][currentChild].menantu.push({ name: menantu2, status: statusMenantu2 });
            }
        }

        for (let j = Math.max(statusMenantu1ColIndex, statusMenantu2ColIndex, coupleColIndex, childColIndex, statusAnakColIndex) + 1; j < columns.length; j++) {
            const grandchild = columns[j].trim();
            if (grandchild && currentChild) {
                familyData[currentCouple][currentChild].grandchildren.push(grandchild);
            }
        }
    }
    return familyData;
}

/**
 * Fungsi untuk memfilter data silsilah berdasarkan input pencarian.
 */
function filterFamilyTree() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = {};

    for (const couple in fullFamilyData) {
        const children = fullFamilyData[couple];
        const filteredChildren = {};
        let hasMatch = false;
        const cleanCoupleName = couple.replace(/^[IVX]+\s/g, '').replace(/^\d+\.\s*/, '').trim().toLowerCase();

        if (cleanCoupleName.includes(searchTerm)) {
            filteredData[couple] = children;
            hasMatch = true;
        } else {
            for (const child in children) {
                const childData = children[child];
                const cleanChildName = child.replace(/^\d+\.\s*/, '').trim().toLowerCase();
                const statusAnak = childData.statusAnak.toLowerCase();
                let menantuMatch = false;
                childData.menantu.forEach(m => {
                    if (m.name.toLowerCase().includes(searchTerm) || m.status.toLowerCase().includes(searchTerm)) {
                        menantuMatch = true;
                    }
                });
                
                if (cleanChildName.includes(searchTerm) || statusAnak.includes(searchTerm) || menantuMatch) {
                    filteredChildren[child] = childData;
                    hasMatch = true;
                } else {
                    const matchingGrandchildren = childData.grandchildren.filter(gc => gc.toLowerCase().includes(searchTerm));
                    if (matchingGrandchildren.length > 0) {
                        filteredChildren[child] = { ...childData, grandchildren: matchingGrandchildren };
                        hasMatch = true;
                    }
                }
            }
            if (hasMatch) {
                filteredData[couple] = filteredChildren;
            }
        }
    }
    renderFamilyStructure(filteredData);
}

document.addEventListener('DOMContentLoaded', fetchAndRenderFamilyTree);
