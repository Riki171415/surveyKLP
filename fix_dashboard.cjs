const fs = require('fs');
let content = fs.readFileSync('./src/components/dashboards/DashboardEksekutif.jsx', 'utf8');

const brokenPart = `      </div>
      
      {/* EXCEKUTIF INSIGHT IN EACH TAB */}
      <ExecutiveInsight tab={activeTab} />
    </div>
  );
};

  const [activeTab, setActiveTab] = useState('overview');`;

const fixedPart = `      </div>
    </div>
  );
};

export default function DashboardEksekutif({ data = [] }) {
  const [activeTab, setActiveTab] = useState('overview');`;

content = content.replace(brokenPart, fixedPart);

const endPart = `        )}

      </div>
    </div>
  );
}`;

const correctEndPart = `        )}

      </div>
      
      {/* EXECUTIVE INSIGHT PER TAB */}
      <div className="mt-8">
        <ExecutiveInsight tab={activeTab} />
      </div>
    </div>
  );
}`;

content = content.replace(endPart, correctEndPart);

fs.writeFileSync('./src/components/dashboards/DashboardEksekutif.jsx', content, 'utf8');
console.log('Fixed syntax and placement');
