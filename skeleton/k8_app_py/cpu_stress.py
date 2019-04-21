from datetime import datetime, timedelta
from multiprocessing import Pool, cpu_count


class CpuStress:
    def __init__(self, duration=5, cpus=None):
        self.cpus = int(cpus)
        self.duration = int(duration)

    def f(self, x):
        date_now = datetime.now()
        date_limit = date_now + timedelta(seconds=int(self.duration))
        while date_limit > date_now:
            date_now = datetime.now()
            x*x

    def run(self):
        processes = self.cpus if self.cpus else cpu_count()
        pool = Pool(processes)
        pool.map(self.f, range(processes))
        return 'finish: cpus={}, duration:{}'.format(self.cpus, self.duration)
